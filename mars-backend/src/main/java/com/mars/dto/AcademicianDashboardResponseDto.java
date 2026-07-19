package com.mars.dto;

import java.util.List;

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
public class AcademicianDashboardResponseDto {

    private long pendingAppointmentCount;
    private long upcomingAppointmentCount;
    private long activeCourseCount;
    private long pendingDelegationCount;
    private long acceptedDelegationCount;
    private long rejectedDelegationCount;
    private List<StaffAppointmentResponseDto> pendingAppointments;
    private List<StaffAppointmentResponseDto> upcomingAppointments;
}
