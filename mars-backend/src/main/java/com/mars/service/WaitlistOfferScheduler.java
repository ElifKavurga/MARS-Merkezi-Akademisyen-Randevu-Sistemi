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

    private final WaitlistEntryRepository waitlistEntryRepository;
    private final WaitlistService waitlistService;

    @Value("${mars.waitlist.offer-duration-minutes:60}")
    private long offerDurationMinutes;

    @Scheduled(cron = "${mars.waitlist.offer-check-cron:0 */1 * * * *}")
    public void checkExpiredOffers() {
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDateTime cutoff = now.minusMinutes(offerDurationMinutes);

        List<WaitlistEntry> expiredOffers = waitlistEntryRepository.findExpiredOffers(
            WaitlistStatus.NOTIFIED.name(),
            cutoff
        );

        if (!expiredOffers.isEmpty()) {
            LOGGER.info("Found {} expired waitlist offers. Processing expirations...", expiredOffers.size());
        }

        for (WaitlistEntry entry : expiredOffers) {
            try {
                waitlistService.expireOffer(entry.getWaitlistEntryId(), now);
            } catch (RuntimeException ex) {
                LOGGER.error("Failed to expire waitlist offer. waitlistEntryId={}, errorType={}",
                    entry.getWaitlistEntryId(), ex.getClass().getSimpleName());
            }
        }
    }
}
