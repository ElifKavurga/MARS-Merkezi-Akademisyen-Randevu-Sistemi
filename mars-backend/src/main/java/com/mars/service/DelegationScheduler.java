package com.mars.service;

import java.time.LocalDateTime;
import java.time.ZoneId;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DelegationScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(DelegationScheduler.class);
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final String EXPIRE_SCHEDULER_NAME = "DelegationExpiry";
    private static final String SYNC_SCHEDULER_NAME   = "DelegationSync";

    private final DelegationService delegationService;
    private final SchedulerRegistry schedulerRegistry;

    @Scheduled(fixedDelay = 60_000)
    public void expireStudentApprovals() {
        SchedulerMonitor.SchedulerRunContext ctx =
                SchedulerMonitor.start(LOGGER, EXPIRE_SCHEDULER_NAME, schedulerRegistry);
        try {
            int expired = delegationService.expireStudentApprovals(LocalDateTime.now(APP_ZONE));
            ctx.addProcessed(expired);
            ctx.addUpdated(expired);
        } catch (RuntimeException ex) {
            ctx.incrementErrors();
            LOGGER.error("[{}] Failed to expire student approvals. errorType={}",
                    EXPIRE_SCHEDULER_NAME, ex.getClass().getSimpleName());
        } finally {
            ctx.finish();
        }
    }

    @Scheduled(fixedDelay = 60_000)
    public void synchronizeAcceptedDelegations() {
        SchedulerMonitor.SchedulerRunContext ctx =
                SchedulerMonitor.start(LOGGER, SYNC_SCHEDULER_NAME, schedulerRegistry);
        try {
            int synced = delegationService.synchronizeAcceptedDelegations(LocalDateTime.now(APP_ZONE));
            ctx.addProcessed(synced);
            ctx.addUpdated(synced);
        } catch (RuntimeException ex) {
            ctx.incrementErrors();
            LOGGER.error("[{}] Failed to synchronize accepted delegations. errorType={}",
                    SYNC_SCHEDULER_NAME, ex.getClass().getSimpleName());
        } finally {
            ctx.finish();
        }
    }
}
