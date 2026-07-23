package com.mars.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mars.entity.WaitlistEntry;
import com.mars.enums.WaitlistStatus;
import com.mars.repository.WaitlistEntryRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class WaitlistOfferScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(WaitlistOfferScheduler.class);
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final String SCHEDULER_NAME = "WaitlistOfferExpiry";

    private final WaitlistEntryRepository waitlistEntryRepository;
    private final WaitlistService waitlistService;

    @Value("${mars.waitlist.offer-duration-minutes:60}")
    private long offerDurationMinutes;

    @Scheduled(cron = "${mars.waitlist.offer-check-cron:0 */1 * * * *}")
    public void checkExpiredOffers() {
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDateTime cutoff = now.minusMinutes(offerDurationMinutes);

        SchedulerMonitor.SchedulerRunContext ctx = SchedulerMonitor.start(LOGGER, SCHEDULER_NAME);
        try {
            List<WaitlistEntry> expiredOffers = waitlistEntryRepository.findExpiredOffers(
                    WaitlistStatus.NOTIFIED.name(), cutoff);

            ctx.addProcessed(expiredOffers.size());

            for (WaitlistEntry entry : expiredOffers) {
                try {
                    waitlistService.expireOffer(entry.getWaitlistEntryId(), now);
                    ctx.incrementUpdated();
                } catch (RuntimeException ex) {
                    ctx.incrementErrors();
                    LOGGER.error("[{}] Failed to expire waitlist offer. waitlistEntryId={}, errorType={}",
                            SCHEDULER_NAME, entry.getWaitlistEntryId(), ex.getClass().getSimpleName());
                }
            }
        } catch (RuntimeException ex) {
            ctx.incrementErrors();
            LOGGER.error("[{}] Fatal error during offer expiry scan. errorType={}",
                    SCHEDULER_NAME, ex.getClass().getSimpleName());
        } finally {
            ctx.finish();
        }
    }
}
