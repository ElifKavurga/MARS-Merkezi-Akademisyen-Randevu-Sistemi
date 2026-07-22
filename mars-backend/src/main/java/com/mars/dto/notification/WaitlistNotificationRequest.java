package com.mars.dto.notification;

import java.time.LocalDate;
import java.time.LocalTime;

import com.mars.enums.WaitlistNotificationEvent;

public record WaitlistNotificationRequest(
        Integer recipientUserId,
        Integer waitlistEntryId,
        WaitlistNotificationEvent event,
        String studentName,
        String staffName,
        String categoryName,
        String course,
        LocalDate availableDate,
        LocalTime availableStartTime,
        LocalTime availableEndTime,
        String reservationInformation) {
}
