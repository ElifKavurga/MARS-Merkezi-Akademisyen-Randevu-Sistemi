package com.mars.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AppointmentRescheduleResponse {
    private Integer rescheduleRequestId;
    private Integer appointmentId;
    private String status;
    private LocalDate proposedDate;
    private LocalTime proposedStartTime;
    private LocalTime proposedEndTime;
    private String proposedMeetingType;
    private LocalDateTime expiresAt;
}
