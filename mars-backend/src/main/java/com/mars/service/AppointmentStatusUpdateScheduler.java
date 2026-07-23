package com.mars.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AppointmentStatusUpdateScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(AppointmentStatusUpdateScheduler.class);
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final List<String> ACTIVE_STATUSES = List.of("APPROVED", "RESCHEDULED_APPROVED");

    private final AppointmentStatusUpdateService statusUpdateService;
    private final long toleranceMinutes;

    public AppointmentStatusUpdateScheduler(
            AppointmentStatusUpdateService statusUpdateService,
            @Value("${mars.appointment.status-update-tolerance-minutes:15}") long toleranceMinutes) {
        this.statusUpdateService = statusUpdateService;
        this.toleranceMinutes = toleranceMinutes;
    }

    @Scheduled(cron = "${mars.appointment.status-update-cron:0 */5 * * * *}")
    public void runStatusUpdate() {
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDateTime cutoffDateTime = now.minusMinutes(toleranceMinutes);

        LOGGER.info("Starting automatic appointment status update scheduler run. Cutoff: {}", cutoffDateTime);

        int updatedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;

        try {
            List<Integer> candidateIds = statusUpdateService.findCandidates(cutoffDateTime, ACTIVE_STATUSES, 100);
            
            for (Integer id : candidateIds) {
                try {
                    boolean updated = statusUpdateService.completeAppointment(id, now);
                    if (updated) {
                        updatedCount++;
                    } else {
                        skippedCount++;
                    }
                } catch (RuntimeException ex) {
                    errorCount++;
                    LOGGER.error("Failed to complete appointment automatically. appointmentId={}, errorType={}",
                            id, ex.getClass().getSimpleName());
                }
            }

            int processedCount = candidateIds.size();
            LOGGER.info("Automatic appointment status update completed. Processed: {}, Updated: {}, Skipped: {}, Errors: {}",
                    processedCount, updatedCount, skippedCount, errorCount);

        } catch (RuntimeException ex) {
            LOGGER.error("Error occurred during status update scan. errorType={}", ex.getClass().getSimpleName());
        }
    }
}
