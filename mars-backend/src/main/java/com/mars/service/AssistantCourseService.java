package com.mars.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.AssistantCourseResponseDto;
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
