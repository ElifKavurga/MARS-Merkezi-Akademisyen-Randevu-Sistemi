package com.mars.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AppointmentReminderSchedulerTest {
    @Mock private AppointmentReminderService reminderService;

    @Test
    void scheduledScan_delegatesToReminderService() {
        AppointmentReminderScheduler scheduler = new AppointmentReminderScheduler(reminderService);

        scheduler.sendAppointmentReminders();

        verify(reminderService).sendDueReminders(any(LocalDateTime.class));
    }

    @Test
    void unexpectedScanFailure_doesNotEscapeSchedulerCycle() {
        AppointmentReminderScheduler scheduler = new AppointmentReminderScheduler(reminderService);
        doThrow(new IllegalStateException("database unavailable"))
                .when(reminderService).sendDueReminders(any(LocalDateTime.class));

        assertThatCode(scheduler::sendAppointmentReminders).doesNotThrowAnyException();
    }
}
