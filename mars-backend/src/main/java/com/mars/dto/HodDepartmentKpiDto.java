package com.mars.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodDepartmentKpiDto {
    private Long totalAcademicians;
    private Long activeAcademicians;
    private Long totalAppointments;
    private Long todayAppointments;
    private Long pendingAppointments;
    private Long completedAppointments;
    private Long noShowCount;
    private Long waitlistStudentCount;
}
