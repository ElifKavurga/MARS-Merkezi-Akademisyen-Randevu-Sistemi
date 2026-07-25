package com.mars.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.AcademicianDashboardResponseDto;
import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.dto.HodAcademicianStatsDto;
import com.mars.entity.User;

import com.mars.enums.AppointmentStatus;
import com.mars.enums.DelegationStatus;
import com.mars.enums.RoleType;
import com.mars.mapper.AppointmentMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.CourseRepository;
import com.mars.repository.DelegationLogRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AcademicianDashboardService {

    private static final int PREVIEW_LIMIT = 3;

    private final AppointmentRepository appointmentRepository;
    private final CourseRepository courseRepository;
    private final DelegationLogRepository delegationLogRepository;
    private final AppointmentMapper appointmentMapper;

    @Transactional(readOnly = true)
    public AcademicianDashboardResponseDto getDashboardSummary() {
        User academician = getCurrentAcademician();
        Integer academicianId = academician.getUserId();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        PageRequest previewPage = PageRequest.of(0, PREVIEW_LIMIT);

        long pendingCount = appointmentRepository
                .countByStaff_UserIdAndAppointmentStatus(
                        academicianId, AppointmentStatus.PENDING.name());
        long upcomingCount = appointmentRepository.countUpcomingByStaffIdAndStatus(
                academicianId, AppointmentStatus.APPROVED.name(), today, now);
        long activeCourseCount = courseRepository
                .countByOwnerAcademician_UserIdAndIsActiveTrue(academicianId);
        long pendingDelegationCount = delegationLogRepository
                .countByDelegatedByUser_UserIdAndDelegationStatus(
                        academicianId, DelegationStatus.PENDING.name());
        long acceptedDelegationCount = delegationLogRepository
                .countByDelegatedByUser_UserIdAndDelegationStatus(
                        academicianId, DelegationStatus.ACCEPTED.name());
        long rejectedDelegationCount = delegationLogRepository
                .countByDelegatedByUser_UserIdAndDelegationStatus(
                        academicianId, DelegationStatus.REJECTED.name());

        List<StaffAppointmentResponseDto> pendingAppointments =
                appointmentRepository.findPendingDashboardPreview(
                                academicianId,
                                AppointmentStatus.PENDING.name(),
                                today,
                                now,
                                previewPage)
                        .stream()
                        .map(appointmentMapper::toStaffResponse)
                        .toList();

        List<StaffAppointmentResponseDto> upcomingAppointments =
                appointmentRepository.findUpcomingDashboardPreview(
                                academicianId,
                                AppointmentStatus.APPROVED.name(),
                                today,
                                now,
                                previewPage)
                        .stream()
                        .map(appointmentMapper::toStaffResponse)
                        .toList();

        return AcademicianDashboardResponseDto.builder()
                .pendingAppointmentCount(pendingCount)
                .upcomingAppointmentCount(upcomingCount)
                .activeCourseCount(activeCourseCount)
                .pendingDelegationCount(pendingDelegationCount)
                .acceptedDelegationCount(acceptedDelegationCount)
                .rejectedDelegationCount(rejectedDelegationCount)
                .pendingAppointments(pendingAppointments)
                .upcomingAppointments(upcomingAppointments)
                .build();
    }

    @Transactional(readOnly = true)
    public HodAcademicianStatsDto getDashboardStats() {
        User academician = getCurrentAcademician();
        Integer academicianId = academician.getUserId();
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        LocalDate yearStart = today.minusMonths(11).withDayOfMonth(1);

        List<HodAcademicianStatsDto.StatusCount> statusDistribution = appointmentRepository
                .countByStatusForStaff(academicianId)
                .stream()
                .map(row -> HodAcademicianStatsDto.StatusCount.builder()
                        .status((String) row[0])
                        .count((Long) row[1])
                        .build())
                .toList();

        List<HodAcademicianStatsDto.CategoryCount> categoryDistribution = appointmentRepository
                .countByCategoryForStaff(academicianId)
                .stream()
                .map(row -> HodAcademicianStatsDto.CategoryCount.builder()
                        .categoryName((String) row[0])
                        .count((Long) row[1])
                        .build())
                .toList();

        java.util.Map<LocalDate, Long> weeklyMap = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            weeklyMap.put(weekStart.plusDays(i), 0L);
        }
        appointmentRepository.countByDayForStaffInRange(academicianId, weekStart, today)
                .forEach(row -> weeklyMap.put((LocalDate) row[0], (Long) row[1]));
        List<HodAcademicianStatsDto.DayCount> weeklyTrend = weeklyMap.entrySet().stream()
                .map(e -> HodAcademicianStatsDto.DayCount.builder()
                        .date(e.getKey().toString())
                        .count(e.getValue())
                        .build())
                .toList();

        java.util.Map<String, Long> monthlyMap = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 12; i++) {
            LocalDate month = yearStart.plusMonths(i);
            monthlyMap.put(String.format("%04d-%02d", month.getYear(), month.getMonthValue()), 0L);
        }
        appointmentRepository.countByMonthForStaffInRange(academicianId, yearStart, today)
                .forEach(row -> {
                    String key = String.format("%04d-%02d", ((Number) row[0]).intValue(), ((Number) row[1]).intValue());
                    monthlyMap.put(key, (Long) row[2]);
                });
        List<HodAcademicianStatsDto.MonthCount> monthlyTrend = monthlyMap.entrySet().stream()
                .map(e -> HodAcademicianStatsDto.MonthCount.builder()
                        .yearMonth(e.getKey())
                        .count(e.getValue())
                        .build())
                .toList();

        return HodAcademicianStatsDto.builder()
                .statusDistribution(statusDistribution)
                .categoryDistribution(categoryDistribution)
                .weeklyTrend(weeklyTrend)
                .monthlyTrend(monthlyTrend)
                .build();
    }

    private User getCurrentAcademician() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }

        User user = userDetails.getUser();
        if (user.getRole() == null
                || (!RoleType.ACADEMICIAN.name().equals(user.getRole().getRoleName())
                && !RoleType.HOD.name().equals(user.getRole().getRoleName()))) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return user;
    }
}
