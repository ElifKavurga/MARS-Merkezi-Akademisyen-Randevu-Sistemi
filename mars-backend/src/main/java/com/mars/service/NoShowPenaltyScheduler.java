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
    private static final String NO_SHOW_SCHEDULER_NAME = "NoShowDetection";
    private static final String LIFT_SCHEDULER_NAME    = "PenaltyLift";

    private final NoShowPenaltyService noShowPenaltyService;
    private final SchedulerRegistry schedulerRegistry;

    @Scheduled(cron = "${mars.penalty.no-show-cron:0 */5 * * * *}")
    public void runNoShowDetection() {
        SchedulerMonitor.SchedulerRunContext ctx =
                SchedulerMonitor.start(LOGGER, NO_SHOW_SCHEDULER_NAME, schedulerRegistry);
        try {
            LocalDateTime now = LocalDateTime.now(APP_ZONE);
            int processedCount = noShowPenaltyService.processNoShows(now);
            ctx.addProcessed(processedCount);
            ctx.addUpdated(processedCount);
        } catch (Exception e) {
            ctx.incrementErrors();
            LOGGER.error("[{}] Fatal error during missed appointment detection. errorType={}",
                    NO_SHOW_SCHEDULER_NAME, e.getClass().getSimpleName(), e);
        } finally {
            ctx.finish();
        }
    }

    @Scheduled(cron = "${mars.penalty.lift-cron:0 0 * * * *}")
    public void runLiftExpiredPenalties() {
        SchedulerMonitor.SchedulerRunContext ctx =
                SchedulerMonitor.start(LOGGER, LIFT_SCHEDULER_NAME, schedulerRegistry);
        try {
            LocalDate today = LocalDate.now(APP_ZONE);
            int liftedCount = noShowPenaltyService.liftExpiredPenalties(today);
            ctx.addProcessed(liftedCount);
            ctx.addUpdated(liftedCount);
        } catch (Exception e) {
            ctx.incrementErrors();
            LOGGER.error("[{}] Fatal error during penalty lift. errorType={}",
                    LIFT_SCHEDULER_NAME, e.getClass().getSimpleName(), e);
        } finally {
            ctx.finish();
        }
    }
}
