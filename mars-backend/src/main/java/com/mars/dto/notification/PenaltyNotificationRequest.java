package com.mars.dto.notification;

import java.time.LocalDate;

import com.mars.enums.PenaltyNotificationEvent;

public record PenaltyNotificationRequest(
        Integer recipientUserId,
        Integer penaltyReferenceId,
        PenaltyNotificationEvent event,
        String studentName,
        String reason,
        LocalDate startDate,
        LocalDate endDate,
        Integer durationDays) {
}
