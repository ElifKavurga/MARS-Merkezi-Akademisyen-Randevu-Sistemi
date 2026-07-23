package com.mars.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mars.entity.WaitlistEntry;
import com.mars.enums.WaitlistStatus;
import com.mars.repository.WaitlistEntryRepository;

@ExtendWith(MockitoExtension.class)
class WaitlistOfferSchedulerTest {

    @Mock private WaitlistEntryRepository waitlistEntryRepository;
    @Mock private WaitlistService waitlistService;

    private WaitlistOfferScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new WaitlistOfferScheduler(waitlistEntryRepository, waitlistService);
        // Inject the @Value field (offer-duration-minutes default = 60)
        org.springframework.test.util.ReflectionTestUtils.setField(scheduler, "offerDurationMinutes", 60L);
    }

    @Test
    void noExpiredOffers_doesNothing() {
        when(waitlistEntryRepository.findExpiredOffers(any(), any())).thenReturn(Collections.emptyList());

        assertThatCode(scheduler::checkExpiredOffers).doesNotThrowAnyException();

        verify(waitlistService, never()).expireOffer(any(), any());
    }

    @Test
    void expiredOffers_areAllProcessed() {
        WaitlistEntry e1 = new WaitlistEntry(); e1.setWaitlistEntryId(1);
        WaitlistEntry e2 = new WaitlistEntry(); e2.setWaitlistEntryId(2);

        when(waitlistEntryRepository.findExpiredOffers(
                eq(WaitlistStatus.NOTIFIED.name()), any(LocalDateTime.class)))
                .thenReturn(List.of(e1, e2));

        scheduler.checkExpiredOffers();

        verify(waitlistService, times(1)).expireOffer(eq(1), any());
        verify(waitlistService, times(1)).expireOffer(eq(2), any());
    }

    @Test
    void singleFailure_doesNotStopOtherEntries() {
        WaitlistEntry e1 = new WaitlistEntry(); e1.setWaitlistEntryId(1);
        WaitlistEntry e2 = new WaitlistEntry(); e2.setWaitlistEntryId(2);

        when(waitlistEntryRepository.findExpiredOffers(any(), any())).thenReturn(List.of(e1, e2));
        doThrow(new RuntimeException("db error")).when(waitlistService).expireOffer(eq(1), any());

        // Must not throw even though entry 1 fails
        assertThatCode(scheduler::checkExpiredOffers).doesNotThrowAnyException();

        // Entry 2 must still be processed
        verify(waitlistService, times(1)).expireOffer(eq(2), any());
    }

    @Test
    void repositoryFailure_doesNotEscapeSchedulerCycle() {
        when(waitlistEntryRepository.findExpiredOffers(any(), any()))
                .thenThrow(new RuntimeException("db unavailable"));

        assertThatCode(scheduler::checkExpiredOffers).doesNotThrowAnyException();
    }

    @Test
    void idempotent_alreadyExpiredEntryNotReprocessed() {
        // If the repo returns an empty list on the second run, nothing is called
        when(waitlistEntryRepository.findExpiredOffers(any(), any()))
                .thenReturn(Collections.emptyList());

        scheduler.checkExpiredOffers();
        scheduler.checkExpiredOffers();

        verify(waitlistService, never()).expireOffer(any(), any());
    }
}
