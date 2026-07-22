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
    private String academicianName;
    private String studentName;
    private LocalDate originalDate;
    private LocalTime originalStartTime;
    private LocalTime originalEndTime;
    private LocalDate proposedDate;
    private LocalTime proposedStartTime;
    private LocalTime proposedEndTime;
    private String proposedMeetingType;
    private String categoryName;
    private LocalDateTime expiresAt;
}
