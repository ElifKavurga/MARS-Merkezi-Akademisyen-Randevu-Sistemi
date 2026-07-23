package com.mars.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class NoShowPenaltyScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(NoShowPenaltyScheduler.class);
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");

    private final NoShowPenaltyService noShowPenaltyService;

    @Scheduled(cron = "${mars.penalty.no-show-cron:0 */5 * * * *}")
    public void runNoShowDetection() {
        LOGGER.info("Starting automated No-Show detection...");
        try {
            LocalDateTime now = LocalDateTime.now(APP_ZONE);
            int processedCount = noShowPenaltyService.processNoShows(now);
            if (processedCount > 0) {
                LOGGER.info("No-Show detection finished. Processed {} appointments.", processedCount);
            }
        } catch (Exception e) {
            LOGGER.error("Error during automated No-Show detection: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "${mars.penalty.lift-cron:0 0 * * * *}")
    public void runLiftExpiredPenalties() {
        LOGGER.info("Starting automated lifting of expired penalties...");
        try {
            LocalDate today = LocalDate.now(APP_ZONE);
            int liftedCount = noShowPenaltyService.liftExpiredPenalties(today);
            if (liftedCount > 0) {
                LOGGER.info("Penalty lifting finished. Lifted penalties for {} students.", liftedCount);
            }
        } catch (Exception e) {
            LOGGER.error("Error during automated lifting of expired penalties: {}", e.getMessage(), e);
        }
    }
}
