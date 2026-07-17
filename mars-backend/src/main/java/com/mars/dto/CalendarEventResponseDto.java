package com.mars.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEventResponseDto {

    private String eventType;
    private Integer slotId;
    private Integer appointmentId;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer recurrenceRuleId;
    private Boolean isBlocked;
    private String meetingType;
    private String studentName;
    private String categoryName;
    private String courseCode;
    private String courseName;
    private String appointmentStatus;
}
