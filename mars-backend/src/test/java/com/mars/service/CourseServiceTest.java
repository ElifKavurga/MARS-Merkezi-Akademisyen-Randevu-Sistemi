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

import com.mars.dto.CourseResponseDto;
import com.mars.entity.Course;
import com.mars.entity.Department;
import com.mars.entity.User;
import com.mars.mapper.CourseMapper;
import com.mars.repository.CourseRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseMapper courseMapper;

    @InjectMocks
    private CourseService courseService;

    private User academician;
    private Course course;
    private CourseResponseDto responseDto;

    @BeforeEach
    void setUp() {
        academician = new User();
        academician.setUserId(10);

        Department department = new Department();
        department.setDepartmentId(1);
        department.setDepartmentName("Bilgisayar Mühendisliği");

        course = new Course();
        course.setCourseId(1);
        course.setCourseCode("CENG 301");
        course.setCourseName("Algoritma Analizi");
        course.setAcademicTerm("2024-2025 Güz");
        course.setDepartment(department);
        course.setOwnerAcademician(academician);

        responseDto = CourseResponseDto.builder()
                .courseId(1)
                .courseCode("CENG 301")
                .courseName("Algoritma Analizi")
                .academicTerm("2024-2025 Güz")
                .departmentId(1)
                .departmentName("Bilgisayar Mühendisliği")
                .build();

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
    void getMyCourses_returnsOwnedCoursesMapped() {
        when(courseRepository.findByOwnerAcademician_UserIdOrderByCourseNameAsc(10))
                .thenReturn(List.of(course));
        when(courseMapper.toResponse(course)).thenReturn(responseDto);

        List<CourseResponseDto> result = courseService.getMyCourses();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCourseCode()).isEqualTo("CENG 301");
        assertThat(result.get(0).getDepartmentName()).isEqualTo("Bilgisayar Mühendisliği");
        verify(courseRepository).findByOwnerAcademician_UserIdOrderByCourseNameAsc(10);
        verify(courseMapper).toResponse(course);
    }

    @Test
    void getMyCourses_emptyList_returnsEmpty() {
        when(courseRepository.findByOwnerAcademician_UserIdOrderByCourseNameAsc(10))
                .thenReturn(List.of());

        List<CourseResponseDto> result = courseService.getMyCourses();

        assertThat(result).isEmpty();
    }

    @Test
    void getMyCourses_withoutAuthentication_throwsAccessDenied() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> courseService.getMyCourses())
                .isInstanceOf(AccessDeniedException.class);
    }
}
