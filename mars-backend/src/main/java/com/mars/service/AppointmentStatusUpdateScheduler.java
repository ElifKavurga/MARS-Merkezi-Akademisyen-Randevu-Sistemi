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
    private static final String SCHEDULER_NAME = "AppointmentStatusUpdate";
    private static final List<String> ACTIVE_STATUSES = List.of("APPROVED", "RESCHEDULED_APPROVED");

    private final AppointmentStatusUpdateService statusUpdateService;
    private final SchedulerRegistry schedulerRegistry;
    private final long toleranceMinutes;

    public AppointmentStatusUpdateScheduler(
            AppointmentStatusUpdateService statusUpdateService,
            SchedulerRegistry schedulerRegistry,
            @Value("${mars.appointment.status-update-tolerance-minutes:15}") long toleranceMinutes) {
        this.statusUpdateService = statusUpdateService;
        this.schedulerRegistry   = schedulerRegistry;
        this.toleranceMinutes    = toleranceMinutes;
    }

    @Scheduled(cron = "${mars.appointment.status-update-cron:0 */5 * * * *}")
    public void runStatusUpdate() {
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDateTime cutoffDateTime = now.minusMinutes(toleranceMinutes);

        SchedulerMonitor.SchedulerRunContext ctx =
                SchedulerMonitor.start(LOGGER, SCHEDULER_NAME, schedulerRegistry);
        try {
            List<Integer> candidateIds = statusUpdateService.findCandidates(cutoffDateTime, ACTIVE_STATUSES, 100);
            ctx.addProcessed(candidateIds.size());

            for (Integer id : candidateIds) {
                try {
                    boolean updated = statusUpdateService.completeAppointment(id, now);
                    if (updated) {
                        ctx.incrementUpdated();
                    } else {
                        ctx.incrementSkipped();
                    }
                } catch (RuntimeException ex) {
                    ctx.incrementErrors();
                    LOGGER.error("[{}] Failed to complete appointment. appointmentId={}, errorType={}",
                            SCHEDULER_NAME, id, ex.getClass().getSimpleName());
                }
            }
        } catch (RuntimeException ex) {
            ctx.incrementErrors();
            LOGGER.error("[{}] Fatal error during status update scan. errorType={}",
                    SCHEDULER_NAME, ex.getClass().getSimpleName());
        } finally {
            ctx.finish();
        }
    }
}
