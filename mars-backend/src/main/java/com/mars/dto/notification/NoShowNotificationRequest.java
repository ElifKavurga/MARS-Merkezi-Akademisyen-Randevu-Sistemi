package com.mars.dto.notification;

import java.time.LocalDate;
import java.time.LocalTime;

public record NoShowNotificationRequest(
        Integer studentUserId,
        Integer staffUserId,
        Integer appointmentId,
        String studentName,
        String staffName,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        String categoryName,
        String course,
        String nextProcessInformation) {
}
