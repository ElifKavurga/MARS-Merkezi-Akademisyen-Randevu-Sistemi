package com.mars.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodAcademicianListDto {
    private Integer userId;
    private String fullName;
    private String academicTitle;
    private long activeOfficeHoursCount;
    private long todayAppointmentsCount;
    private long pendingAppointmentsCount;
    private long totalAppointmentsCount;
}
