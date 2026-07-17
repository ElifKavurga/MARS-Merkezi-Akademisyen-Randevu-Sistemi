package com.mars.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.AssistantCourseResponseDto;
import com.mars.dto.AssistantDashboardResponseDto;
import com.mars.entity.Course;
import com.mars.entity.CourseAssignment;
import com.mars.entity.User;
import com.mars.enums.RoleType;
import com.mars.mapper.AssistantCourseMapper;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AssistantCourseService {

    private static final int DASHBOARD_PREVIEW_LIMIT = 5;

    private final CourseAssignmentRepository courseAssignmentRepository;
    private final AssistantCourseMapper assistantCourseMapper;

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
        List<CourseAssignment> assignments =
                courseAssignmentRepository.findAssignedCoursesByAssistantId(assistant.getUserId());

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

        return AssistantDashboardResponseDto.builder()
                .assignedCourseCount(uniqueCourses.size())
                .relatedAcademicianCount(relatedAcademicianIds.size())
                .assignedCoursesPreview(preview)
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
