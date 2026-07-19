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
public class StaffAppointmentResponseDto {

    private Integer appointmentId;
    private Integer staffId;
    private String studentName;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String categoryName;
    private Integer courseId;
    private String courseCode;
    private String courseName;
    private String meetingType;
    private String appointmentStatus;
}
