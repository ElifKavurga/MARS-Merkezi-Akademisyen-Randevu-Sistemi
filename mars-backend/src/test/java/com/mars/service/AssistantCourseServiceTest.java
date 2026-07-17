package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.dto.AssistantCourseResponseDto;
import com.mars.entity.CourseAssignment;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.enums.RoleType;
import com.mars.mapper.AssistantCourseMapper;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class AssistantCourseServiceTest {

    @Mock
    private CourseAssignmentRepository courseAssignmentRepository;

    @Mock
    private AssistantCourseMapper assistantCourseMapper;

    @InjectMocks
    private AssistantCourseService assistantCourseService;

    private User assistant;

    @BeforeEach
    void setUp() {
        Role role = new Role();
        role.setRoleName(RoleType.ASSISTANT.name());

        assistant = new User();
        assistant.setUserId(20);
        assistant.setRole(role);

        setAuthenticatedUser(assistant);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAssignedCourses_multipleAssignments_returnsAllOwnCourses() {
        CourseAssignment first = new CourseAssignment();
        CourseAssignment second = new CourseAssignment();
        AssistantCourseResponseDto firstResponse = response(1, "BLM101");
        AssistantCourseResponseDto secondResponse = response(2, "BLM202");

        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20))
                .thenReturn(List.of(first, second));
        when(assistantCourseMapper.toResponse(first)).thenReturn(firstResponse);
        when(assistantCourseMapper.toResponse(second)).thenReturn(secondResponse);

        List<AssistantCourseResponseDto> result = assistantCourseService.getAssignedCourses();

        assertThat(result).containsExactly(firstResponse, secondResponse);
        verify(courseAssignmentRepository).findAssignedCoursesByAssistantId(20);
    }

    @Test
    void getAssignedCourses_noAssignments_returnsEmptyList() {
        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20)).thenReturn(List.of());

        assertThat(assistantCourseService.getAssignedCourses()).isEmpty();
        verify(courseAssignmentRepository).findAssignedCoursesByAssistantId(20);
    }

    @Test
    void getAssignedCourses_usesAuthenticatedAssistantId_notAnotherAssistant() {
        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20)).thenReturn(List.of());

        assistantCourseService.getAssignedCourses();

        verify(courseAssignmentRepository).findAssignedCoursesByAssistantId(20);
    }

    @Test
    void getAssignedCourses_nonAssistant_throwsAccessDenied() {
        Role role = new Role();
        role.setRoleName(RoleType.ACADEMICIAN.name());
        assistant.setRole(role);
        setAuthenticatedUser(assistant);

        assertThatThrownBy(() -> assistantCourseService.getAssignedCourses())
                .isInstanceOf(AccessDeniedException.class);
    }

    private void setAuthenticatedUser(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, List.of()));
    }

    private AssistantCourseResponseDto response(Integer courseId, String courseCode) {
        return AssistantCourseResponseDto.builder()
                .courseId(courseId)
                .courseCode(courseCode)
                .courseName("Ders " + courseId)
                .academicTerm("2026-2027 Güz")
                .ownerAcademicianName("Dr. Akademisyen")
                .build();
    }
}
