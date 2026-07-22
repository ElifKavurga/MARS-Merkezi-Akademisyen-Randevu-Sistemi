package com.mars.dto.mail;

import java.time.LocalDate;
import java.time.LocalTime;

import com.mars.enums.AppointmentReminderType;

public record AppointmentReminderMailContext(
        String recipientEmail,
        String recipientName,
        String studentName,
        String staffName,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        String meetingType,
        String categoryName,
        String course,
        AppointmentReminderType reminderType) {
}
