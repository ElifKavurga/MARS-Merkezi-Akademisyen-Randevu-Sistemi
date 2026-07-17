package com.mars.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.AssistantCourseResponseDto;
import com.mars.dto.AssistantDashboardResponseDto;
import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.entity.Course;
import com.mars.entity.CourseAssignment;
import com.mars.entity.User;
import com.mars.enums.RoleType;
import com.mars.enums.AppointmentStatus;
import com.mars.mapper.AppointmentMapper;
import com.mars.mapper.AssistantCourseMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AssistantCourseService {

    private static final int DASHBOARD_PREVIEW_LIMIT = 5;
    private static final int APPOINTMENT_PREVIEW_LIMIT = 3;

    private final CourseAssignmentRepository courseAssignmentRepository;
    private final AssistantCourseMapper assistantCourseMapper;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentMapper appointmentMapper;

    @Transactional(readOnly = true)
    public List<AssistantCourseResponseDto> getAssignedCourses() {
        User assistant = getCurrentAssistant();
        return courseAssignmentRepository.findAssignedCoursesByAssistantId(assistant.getUserId())
                .stream()
                .map(assistantCourseMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssistantDashboardResponseDto getDashboardSummary() {
        User assistant = getCurrentAssistant();
        Integer assistantId = assistant.getUserId();
        List<CourseAssignment> assignments =
                courseAssignmentRepository.findAssignedCoursesByAssistantId(assistantId);

        Map<Integer, CourseAssignment> uniqueAssignments = new LinkedHashMap<>();
        for (CourseAssignment assignment : assignments) {
            Course course = assignment.getCourse();
            if (course != null && course.getCourseId() != null) {
                uniqueAssignments.putIfAbsent(course.getCourseId(), assignment);
            }
        }

        List<CourseAssignment> uniqueCourses = List.copyOf(uniqueAssignments.values());
        Set<Integer> relatedAcademicianIds = uniqueCourses.stream()
                .map(CourseAssignment::getCourse)
                .filter(course -> course.getOwnerAcademician() != null)
                .map(course -> course.getOwnerAcademician().getUserId())
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        List<AssistantCourseResponseDto> preview = uniqueCourses.stream()
                .limit(DASHBOARD_PREVIEW_LIMIT)
                .map(assistantCourseMapper::toResponse)
                .toList();

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        PageRequest appointmentPreviewPage = PageRequest.of(0, APPOINTMENT_PREVIEW_LIMIT);
        long pendingAppointmentCount =
                appointmentRepository.countByStaff_UserIdAndAppointmentStatus(
                        assistantId, AppointmentStatus.PENDING.name());
        long upcomingAppointmentCount =
                appointmentRepository.countUpcomingByStaffIdAndStatus(
                        assistantId,
                        AppointmentStatus.APPROVED.name(),
                        today,
                        now);
        List<StaffAppointmentResponseDto> pendingAppointments =
                appointmentRepository.findRecentPendingDashboardPreview(
                                assistantId,
                                AppointmentStatus.PENDING.name(),
                                appointmentPreviewPage)
                        .stream()
                        .map(appointmentMapper::toStaffResponse)
                        .toList();
        List<StaffAppointmentResponseDto> upcomingAppointments =
                appointmentRepository.findUpcomingDashboardPreview(
                                assistantId,
                                AppointmentStatus.APPROVED.name(),
                                today,
                                now,
                                appointmentPreviewPage)
                        .stream()
                        .map(appointmentMapper::toStaffResponse)
                        .toList();

        return AssistantDashboardResponseDto.builder()
                .assignedCourseCount(uniqueCourses.size())
                .relatedAcademicianCount(relatedAcademicianIds.size())
                .assignedCoursesPreview(preview)
                .pendingAppointmentCount(pendingAppointmentCount)
                .upcomingAppointmentCount(upcomingAppointmentCount)
                .pendingAppointments(pendingAppointments)
                .upcomingAppointments(upcomingAppointments)
                .build();
    }

    private User getCurrentAssistant() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }

        User user = userDetails.getUser();
        if (user.getRole() == null
                || !RoleType.ASSISTANT.name().equals(user.getRole().getRoleName())) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return user;
    }
}
