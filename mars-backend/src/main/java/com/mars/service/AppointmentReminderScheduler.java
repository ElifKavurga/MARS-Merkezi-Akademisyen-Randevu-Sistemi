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
public class AppointmentReminderScheduler {
    private static final Logger LOGGER = LoggerFactory.getLogger(AppointmentReminderScheduler.class);
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private final AppointmentReminderService reminderService;

    @Scheduled(fixedDelayString = "${mars.mail.reminder-scan-ms:60000}")
    public void sendAppointmentReminders() {
        try {
            reminderService.sendDueReminders(LocalDateTime.now(APP_ZONE));
        } catch (RuntimeException ex) {
            LOGGER.error("Randevu hatırlatma taraması tamamlanamadı. errorType={}",
                    ex.getClass().getSimpleName());
        }
    }
}
