package com.mars.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NoShowPenaltySchedulerTest {

    @Mock private NoShowPenaltyService noShowPenaltyService;

    private NoShowPenaltyScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new NoShowPenaltyScheduler(noShowPenaltyService, null);

    }

    // ── NoShow detection ──────────────────────────────────────────────────────

    @Test
    void noShowDetection_delegatesToService() {
        when(noShowPenaltyService.processNoShows(any(LocalDateTime.class))).thenReturn(3);

        scheduler.runNoShowDetection();

        verify(noShowPenaltyService, times(1)).processNoShows(any(LocalDateTime.class));
    }

    @Test
    void noShowDetection_serviceException_doesNotEscapeScheduler() {
        when(noShowPenaltyService.processNoShows(any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("db error"));

        assertThatCode(scheduler::runNoShowDetection).doesNotThrowAnyException();
    }

    @Test
    void noShowDetection_idempotent_zeroResults() {
        when(noShowPenaltyService.processNoShows(any(LocalDateTime.class))).thenReturn(0);

        scheduler.runNoShowDetection();
        scheduler.runNoShowDetection();

        verify(noShowPenaltyService, times(2)).processNoShows(any(LocalDateTime.class));
    }

    // ── Penalty lift ──────────────────────────────────────────────────────────

    @Test
    void penaltyLift_delegatesToService() {
        when(noShowPenaltyService.liftExpiredPenalties(any(LocalDate.class))).thenReturn(2);

        scheduler.runLiftExpiredPenalties();

        verify(noShowPenaltyService, times(1)).liftExpiredPenalties(any(LocalDate.class));
    }

    @Test
    void penaltyLift_serviceException_doesNotEscapeScheduler() {
        when(noShowPenaltyService.liftExpiredPenalties(any(LocalDate.class)))
                .thenThrow(new RuntimeException("db error"));

        assertThatCode(scheduler::runLiftExpiredPenalties).doesNotThrowAnyException();
    }

    @Test
    void penaltyLift_idempotent_zeroResults() {
        when(noShowPenaltyService.liftExpiredPenalties(any(LocalDate.class))).thenReturn(0);

        scheduler.runLiftExpiredPenalties();
        scheduler.runLiftExpiredPenalties();

        verify(noShowPenaltyService, times(2)).liftExpiredPenalties(any(LocalDate.class));
    }
}
