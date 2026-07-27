package com.mars.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
public class StudentAppointmentResponseDto {

    private Integer appointmentId;
    private Integer staffId;
    private String staffName;
    private String academicTitle;
    private String departmentName;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String categoryName;
    private Integer courseId;
    private String courseCode;
    private String courseName;
    private String meetingType;
    private String appointmentStatus;
    private LocalDateTime createdAt;
    /** Y�z y�ze gör�şmede ofis bilgisi (henüz User�da yoksa null). */
    private String officeName;
    /** Y�z y�ze gör�şmede bina/konum bilgisi (henüz User�da yoksa null). */
    private String officeLocation;
    private Boolean isDelegated;
    private String delegatedFromStaffName;
    private String delegatedToStaffName;
    private LocalDateTime delegationDate;
}
