package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.mars.StudentAcademicianMessages;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.PageResponseDto;
import com.mars.dto.StudentAcademicianCourseDto;
import com.mars.dto.StudentAcademicianDetailResponseDto;
import com.mars.dto.StudentAcademicianResponseDto;
import com.mars.entity.Course;
import com.mars.entity.Department;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.UserMapper;
import com.mars.repository.CourseRepository;
import com.mars.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class StudentAcademicianServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private AvailabilitySlotService availabilitySlotService;

    @InjectMocks
    private StudentAcademicianService studentAcademicianService;

    @Test
    void searchAcademicians_includesNonAcceptingAcademicianWithFlag() {
        User academician = activeAcademician(7, false);
        StudentAcademicianResponseDto mapped = StudentAcademicianResponseDto.builder()
                .userId(7)
                .fullName("Ayşe Yılmaz")
                .isAcceptingAppointments(false)
                .build();

        when(userRepository.searchActiveAcademicians(
                        anyList(), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(academician), PageRequest.of(0, 12), 1));
        when(userMapper.toStudentAcademicianResponse(academician)).thenReturn(mapped);

        PageResponseDto<StudentAcademicianResponseDto> result =
                studentAcademicianService.searchAcademicians(null, null, null, null, "NAME_ASC", 0, 12);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getIsAcceptingAppointments()).isFalse();
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void searchAcademicians_withCombinedFilters_passesRepositoryArgs() {
        when(userRepository.searchActiveAcademicians(
                        anyList(), eq("Yılmaz"), eq(3), eq("Prof. Dr."), eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(1, 12, Sort.by("fullName").descending()), 0));

        studentAcademicianService.searchAcademicians("Yılmaz", 3, "Prof. Dr.", true, "NAME_DESC", 1, 12);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userRepository).searchActiveAcademicians(
                anyList(), eq("Yılmaz"), eq(3), eq("Prof. Dr."), eq(true), pageableCaptor.capture());
        Pageable pageable = pageableCaptor.getValue();
        assertThat(pageable.getPageNumber()).isEqualTo(1);
        assertThat(pageable.getPageSize()).isEqualTo(12);
        assertThat(pageable.getSort().getOrderFor("fullName").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void searchAcademicians_invalidPage_throwsBadRequest() {
        assertThatThrownBy(() ->
                        studentAcademicianService.searchAcademicians(null, null, null, null, "NAME_ASC", -1, 12))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(StudentAcademicianMessages.INVALID_PAGE);
    }

    @Test
    void searchAcademicians_invalidPageSize_throwsBadRequest() {
        assertThatThrownBy(() ->
                        studentAcademicianService.searchAcademicians(null, null, null, null, "NAME_ASC", 0, 0))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(StudentAcademicianMessages.INVALID_PAGE_SIZE);
    }

    @Test
    void searchAcademicians_invalidSort_throwsBadRequest() {
        assertThatThrownBy(() ->
                        studentAcademicianService.searchAcademicians(null, null, null, null, "INVALID", 0, 12))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(StudentAcademicianMessages.INVALID_SORT);
    }

    @Test
    void getAcademicianDetail_notFound_throwsResourceNotFound() {
        when(userRepository.findActiveAcademicianById(eq(99), anyList())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentAcademicianService.getAcademicianDetail(99))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(StudentAcademicianMessages.ACADEMICIAN_NOT_FOUND);
    }

    @Test
    void getAcademicianDetail_inactiveOrMissingTreatedAsNotFound() {
        // findActiveAcademicianById only returns isActive=true academicians
        when(userRepository.findActiveAcademicianById(eq(8), anyList())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentAcademicianService.getAcademicianDetail(8))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(StudentAcademicianMessages.ACADEMICIAN_NOT_FOUND);
    }

    @Test
    void getAcademicianDetail_invalidId_throwsBadRequest() {
        assertThatThrownBy(() -> studentAcademicianService.getAcademicianDetail(0))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(StudentAcademicianMessages.INVALID_ACADEMICIAN_ID);
    }

    @Test
    void getAcademicianDetail_returnsMappedDetailWithAcceptingFlag() {
        User academician = activeAcademician(7, true);
        Course course = new Course();
        course.setCourseId(1);
        course.setCourseCode("CENG101");
        course.setCourseName("Programlamaya Giriş");
        course.setAcademicTerm("2025-2026 Güz");

        StudentAcademicianCourseDto courseDto = StudentAcademicianCourseDto.builder()
                .courseId(1)
                .courseCode("CENG101")
                .courseName("Programlamaya Giriş")
                .academicTerm("2025-2026 Güz")
                .build();
        StudentAcademicianDetailResponseDto detail = StudentAcademicianDetailResponseDto.builder()
                .userId(7)
                .fullName("Ayşe Yılmaz")
                .isAcceptingAppointments(true)
                .courses(List.of(courseDto))
                .build();

        when(userRepository.findActiveAcademicianById(eq(7), anyList())).thenReturn(Optional.of(academician));
        when(courseRepository.findByOwnerAcademician_UserIdAndIsActiveTrueOrderByCourseNameAsc(7))
                .thenReturn(List.of(course));
        when(userMapper.toStudentAcademicianCourse(course)).thenReturn(courseDto);
        when(userMapper.toStudentAcademicianDetail(academician, List.of(courseDto))).thenReturn(detail);

        StudentAcademicianDetailResponseDto result = studentAcademicianService.getAcademicianDetail(7);

        assertThat(result.getIsAcceptingAppointments()).isTrue();
        assertThat(result.getCourses()).hasSize(1);
    }

    @Test
    void getAcademicianAvailability_notFound_throwsResourceNotFound() {
        when(userRepository.findActiveAcademicianById(eq(99), anyList())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentAcademicianService.getAcademicianAvailability(99))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(StudentAcademicianMessages.ACADEMICIAN_NOT_FOUND);
    }

    @Test
    void getAcademicianAvailability_activeAcademician_delegatesToSlotService() {
        User academician = activeAcademician(7, true);
        AvailableSlotResponseDto slot = AvailableSlotResponseDto.builder().slotId(11).build();

        when(userRepository.findActiveAcademicianById(eq(7), anyList())).thenReturn(Optional.of(academician));
        when(availabilitySlotService.getAvailableSlotsForStaff(7)).thenReturn(List.of(slot));

        List<AvailableSlotResponseDto> result = studentAcademicianService.getAcademicianAvailability(7);

        assertThat(result).containsExactly(slot);
        verify(availabilitySlotService).getAvailableSlotsForStaff(7);
    }

    private static User activeAcademician(int userId, boolean accepting) {
        Role role = new Role();
        role.setRoleId(1);
        role.setRoleName(RoleType.ACADEMICIAN.name());

        Department department = new Department();
        department.setDepartmentId(3);
        department.setDepartmentName("Bilgisayar Mühendisliği");

        User user = new User();
        user.setUserId(userId);
        user.setFullName("Ayşe Yılmaz");
        user.setIsActive(true);
        user.setIsAcceptingAppointments(accepting);
        user.setRole(role);
        user.setDepartment(department);
        return user;
    }
}
