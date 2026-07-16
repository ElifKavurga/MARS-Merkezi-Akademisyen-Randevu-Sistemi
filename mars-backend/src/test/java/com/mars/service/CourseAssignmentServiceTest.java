package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

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

import com.mars.dto.CourseAssignmentUpdateRequest;
import com.mars.dto.CourseAssistantResponseDto;
import com.mars.entity.Course;
import com.mars.entity.CourseAssignment;
import com.mars.entity.Department;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.CourseAssignmentMapper;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.repository.UserRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class CourseAssignmentServiceTest {

    @Mock
    private CourseAssignmentRepository courseAssignmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CourseAssignmentMapper courseAssignmentMapper;

    @InjectMocks
    private CourseAssignmentService courseAssignmentService;

    private User academician;
    private User currentAssistant;
    private User newAssistant;
    private Role assistantRole;
    private Department department;
    private Course course;
    private CourseAssignment assignment;

    @BeforeEach
    void setUp() {
        academician = new User();
        academician.setUserId(10);

        assistantRole = new Role();
        assistantRole.setRoleId(2);
        assistantRole.setRoleName("ASSISTANT");

        department = new Department();
        department.setDepartmentId(1);
        department.setDepartmentName("Bilgisayar Mühendisliği");

        currentAssistant = new User();
        currentAssistant.setUserId(20);
        currentAssistant.setFullName("Ayşe Asistan");
        currentAssistant.setInstitutionalEmail("ayse.asistan@mars.edu.tr");
        currentAssistant.setRole(assistantRole);
        currentAssistant.setDepartment(department);
        currentAssistant.setIsActive(true);

        newAssistant = new User();
        newAssistant.setUserId(21);
        newAssistant.setFullName("Ali Asistan");
        newAssistant.setInstitutionalEmail("ali.asistan@mars.edu.tr");
        newAssistant.setRole(assistantRole);
        newAssistant.setDepartment(department);
        newAssistant.setIsActive(true);

        course = new Course();
        course.setCourseId(1);
        course.setOwnerAcademician(academician);
        course.setIsActive(true);

        assignment = new CourseAssignment();
        assignment.setCourseAssignmentId(5);
        assignment.setCourse(course);
        assignment.setAssistant(currentAssistant);

        CustomUserDetails userDetails = new CustomUserDetails(academician);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void updateAssignment_successfulUpdate() {
        CourseAssignmentUpdateRequest request = new CourseAssignmentUpdateRequest(21);
        CourseAssistantResponseDto response = CourseAssistantResponseDto.builder()
                .assignmentId(5)
                .assistantId(21)
                .assistantName("Ali Asistan")
                .institutionalEmail("ali.asistan@mars.edu.tr")
                .departmentName("Bilgisayar Mühendisliği")
                .build();

        when(courseAssignmentRepository.findByIdWithCourseAndOwner(5)).thenReturn(Optional.of(assignment));
        when(userRepository.findByIdWithRoleAndDepartment(21)).thenReturn(Optional.of(newAssistant));
        when(courseAssignmentRepository.existsByCourse_CourseIdAndAssistant_UserIdAndCourseAssignmentIdNot(1, 21, 5))
                .thenReturn(false);
        when(courseAssignmentRepository.save(assignment)).thenReturn(assignment);
        when(courseAssignmentMapper.toAssistantResponse(assignment)).thenReturn(response);

        CourseAssistantResponseDto result = courseAssignmentService.updateAssignment(5, request);

        assertThat(result.getAssistantId()).isEqualTo(21);
        assertThat(assignment.getAssistant()).isEqualTo(newAssistant);
        verify(courseAssignmentRepository).save(assignment);
    }

    @Test
    void removeAssignment_successfulRemove() {
        when(courseAssignmentRepository.findByIdWithCourseAndOwner(5)).thenReturn(Optional.of(assignment));

        courseAssignmentService.removeAssignment(5);

        verify(courseAssignmentRepository).delete(assignment);
    }

    @Test
    void updateAssignment_otherAcademician_throwsAccessDenied() {
        User otherOwner = new User();
        otherOwner.setUserId(99);
        course.setOwnerAcademician(otherOwner);
        CourseAssignmentUpdateRequest request = new CourseAssignmentUpdateRequest(21);
        when(courseAssignmentRepository.findByIdWithCourseAndOwner(5)).thenReturn(Optional.of(assignment));

        assertThatThrownBy(() -> courseAssignmentService.updateAssignment(5, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("güncelleme");

        verify(courseAssignmentRepository, never()).save(any());
    }

    @Test
    void removeAssignment_otherAcademician_throwsAccessDenied() {
        User otherOwner = new User();
        otherOwner.setUserId(99);
        course.setOwnerAcademician(otherOwner);
        when(courseAssignmentRepository.findByIdWithCourseAndOwner(5)).thenReturn(Optional.of(assignment));

        assertThatThrownBy(() -> courseAssignmentService.removeAssignment(5))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("kaldırma");

        verify(courseAssignmentRepository, never()).delete(any());
    }

    @Test
    void updateAssignment_sameAssistant_throwsConflict() {
        CourseAssignmentUpdateRequest request = new CourseAssignmentUpdateRequest(20);
        when(courseAssignmentRepository.findByIdWithCourseAndOwner(5)).thenReturn(Optional.of(assignment));
        when(userRepository.findByIdWithRoleAndDepartment(20)).thenReturn(Optional.of(currentAssistant));

        assertThatThrownBy(() -> courseAssignmentService.updateAssignment(5, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("zaten atanmış");

        verify(courseAssignmentRepository, never()).save(any());
    }

    @Test
    void updateAssignment_inactiveUser_throwsBadRequest() {
        newAssistant.setIsActive(false);
        CourseAssignmentUpdateRequest request = new CourseAssignmentUpdateRequest(21);
        when(courseAssignmentRepository.findByIdWithCourseAndOwner(5)).thenReturn(Optional.of(assignment));
        when(userRepository.findByIdWithRoleAndDepartment(21)).thenReturn(Optional.of(newAssistant));

        assertThatThrownBy(() -> courseAssignmentService.updateAssignment(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Pasif kullanıcı");

        verify(courseAssignmentRepository, never()).save(any());
    }

    @Test
    void updateAssignment_notFound_throwsNotFound() {
        CourseAssignmentUpdateRequest request = new CourseAssignmentUpdateRequest(21);
        when(courseAssignmentRepository.findByIdWithCourseAndOwner(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseAssignmentService.updateAssignment(99, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Atama bulunamadı");

        verify(courseAssignmentRepository, never()).save(any());
    }

    @Test
    void removeAssignment_notFound_throwsNotFound() {
        when(courseAssignmentRepository.findByIdWithCourseAndOwner(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseAssignmentService.removeAssignment(99))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Atama bulunamadı");

        verify(courseAssignmentRepository, never()).delete(any());
    }
}
