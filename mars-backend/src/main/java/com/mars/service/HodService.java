package com.mars.service;

import java.util.List;
import java.time.LocalDate;
import com.mars.dto.HodAcademicianListDto;
import com.mars.dto.HodAcademicianDetailDto;
import com.mars.dto.HodAcademicianStatsDto;
import com.mars.dto.CalendarEventResponseDto;

public interface HodService {

    /**
     * Get academicians in the same department as the specified HOD user,
     * including their statistics.
     *
     * @param hodUserId The user ID of the HOD
     * @return List of academicians with their stats
     */
    List<HodAcademicianListDto> getDepartmentAcademicians(Integer hodUserId);

    /**
     * Get details of a specific academician in the same department as the HOD user.
     *
     * @param hodUserId The user ID of the HOD
     * @param targetUserId The user ID of the target academician
     * @return Details of the academician with their stats
     */
    HodAcademicianDetailDto getDepartmentAcademicianDetail(Integer hodUserId, Integer targetUserId);

    /**
     * Get statistics charts data for a specific academician in the same department.
     *
     * @param hodUserId    The user ID of the HOD
     * @param targetUserId The user ID of the target academician
     * @return Chart stats data
     */
    HodAcademicianStatsDto getDepartmentAcademicianStats(Integer hodUserId, Integer targetUserId);
    List<CalendarEventResponseDto> getDepartmentAcademicianCalendar(Integer hodUserId, Integer targetUserId, LocalDate from, LocalDate to, boolean includeAppointments);
    List<com.mars.dto.HodRecentAppointmentDto> getDepartmentAcademicianRecentAppointments(Integer hodUserId, Integer targetUserId);
    com.mars.dto.HodPerformanceSummaryDto getDepartmentAcademicianPerformanceSummary(Integer hodUserId, Integer targetUserId);
    com.mars.dto.HodDepartmentKpiDto getDepartmentKpiStats(Integer hodUserId);
    com.mars.dto.HodDepartmentStatsDto getDepartmentStats(Integer hodUserId);
    com.mars.dto.HodDepartmentAnalysisDto getDepartmentAnalysis(Integer hodUserId);
}
