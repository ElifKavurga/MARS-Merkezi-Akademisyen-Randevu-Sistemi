package com.mars.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodAcademicianDetailDto {
    private Integer userId;
    private String fullName;
    private String academicTitle;
    private String departmentName;
    private String institutionalEmail;
    private long activeOfficeHoursCount;
    private long todayAppointmentsCount;
    private long pendingAppointmentsCount;
    private long totalAppointmentsCount;
}
