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

    private User getCurrentAcademician() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }

        User user = userDetails.getUser();
        if (user.getRole() == null
                || !RoleType.ACADEMICIAN.name().equals(user.getRole().getRoleName())) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return user;
    }
}
