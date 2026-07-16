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

import com.mars.dto.CourseCreateRequest;
import com.mars.dto.CourseResponseDto;
import com.mars.dto.CourseUpdateRequest;
import com.mars.entity.Course;
import com.mars.entity.Department;
import com.mars.entity.User;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.CourseMapper;
import com.mars.repository.CourseRepository;
import com.mars.repository.DepartmentRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private CourseMapper courseMapper;

    @InjectMocks
    private CourseService courseService;

    private User academician;
    private Department department;
    private Course course;
    private CourseResponseDto responseDto;

    @BeforeEach
    void setUp() {
        academician = new User();
        academician.setUserId(10);

        department = new Department();
        department.setDepartmentId(1);
        department.setDepartmentName("Bilgisayar Mühendisliği");

        course = new Course();
        course.setCourseId(1);
        course.setCourseCode("CENG 301");
        course.setCourseName("Algoritma Analizi");
        course.setAcademicTerm("2024-2025 Güz");
        course.setDepartment(department);
        course.setOwnerAcademician(academician);
        course.setIsActive(true);

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
        when(courseRepository.findByOwnerAcademician_UserIdAndIsActiveTrueOrderByCourseNameAsc(10))
                .thenReturn(List.of(course));
        when(courseMapper.toResponse(course)).thenReturn(responseDto);

        List<CourseResponseDto> result = courseService.getMyCourses();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCourseCode()).isEqualTo("CENG 301");
        assertThat(result.get(0).getDepartmentName()).isEqualTo("Bilgisayar Mühendisliği");
        verify(courseRepository).findByOwnerAcademician_UserIdAndIsActiveTrueOrderByCourseNameAsc(10);
        verify(courseMapper).toResponse(course);
    }

    @Test
    void getMyCourses_emptyList_returnsEmpty() {
        when(courseRepository.findByOwnerAcademician_UserIdAndIsActiveTrueOrderByCourseNameAsc(10))
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

    @Test
    void createCourse_savesCourseForCurrentUser() {
        CourseCreateRequest request = new CourseCreateRequest("CENG 301", "Algoritma Analizi", "2024-2025 Güz", 1);

        when(courseRepository.existsByOwnerAcademician_UserIdAndCourseCode(10, "CENG 301")).thenReturn(false);
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(courseMapper.toEntity(request, department, academician)).thenReturn(course);
        when(courseRepository.save(course)).thenReturn(course);
        when(courseMapper.toResponse(course)).thenReturn(responseDto);

        CourseResponseDto result = courseService.createCourse(request);

        assertThat(result.getCourseCode()).isEqualTo("CENG 301");
        verify(courseRepository).save(course);
    }

    @Test
    void createCourse_duplicateCourseCode_throwsConflict() {
        CourseCreateRequest request = new CourseCreateRequest("CENG 301", "Algoritma Analizi", "2024-2025 Güz", 1);

        when(courseRepository.existsByOwnerAcademician_UserIdAndCourseCode(10, "CENG 301")).thenReturn(true);

        assertThatThrownBy(() -> courseService.createCourse(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ders kodu");

        verify(courseRepository, never()).save(any());
    }

    @Test
    void createCourse_missingDepartment_throwsNotFound() {
        CourseCreateRequest request = new CourseCreateRequest("CENG 301", "Algoritma Analizi", "2024-2025 Güz", 99);

        when(courseRepository.existsByOwnerAcademician_UserIdAndCourseCode(10, "CENG 301")).thenReturn(false);
        when(departmentRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.createCourse(request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(courseRepository, never()).save(any());
    }

    @Test
    void updateCourse_successfulUpdate() {
        CourseUpdateRequest request = new CourseUpdateRequest("CENG 302", "Veri Yapıları", "2024-2025 Bahar", 1);
        CourseResponseDto updatedResponse = CourseResponseDto.builder()
                .courseId(1)
                .courseCode("CENG 302")
                .courseName("Veri Yapıları")
                .academicTerm("2024-2025 Bahar")
                .departmentId(1)
                .departmentName("Bilgisayar Mühendisliği")
                .build();

        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(courseRepository.existsByOwnerAcademician_UserIdAndCourseCodeAndCourseIdNot(10, "CENG 302", 1))
                .thenReturn(false);
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(courseRepository.save(course)).thenReturn(course);
        when(courseMapper.toResponse(course)).thenReturn(updatedResponse);

        CourseResponseDto result = courseService.updateCourse(1, request);

        assertThat(result.getCourseCode()).isEqualTo("CENG 302");
        verify(courseMapper).updateEntity(course, request, department);
        verify(courseRepository).save(course);
    }

    @Test
    void updateCourse_otherAcademician_throwsAccessDenied() {
        User otherOwner = new User();
        otherOwner.setUserId(99);
        course.setOwnerAcademician(otherOwner);

        CourseUpdateRequest request = new CourseUpdateRequest("CENG 302", "Veri Yapıları", "2024-2025 Bahar", 1);
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.updateCourse(1, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("yetkiniz yok");

        verify(courseRepository, never()).save(any());
    }

    @Test
    void updateCourse_inactiveCourse_throwsBadRequest() {
        course.setIsActive(false);
        CourseUpdateRequest request = new CourseUpdateRequest("CENG 302", "Veri Yapıları", "2024-2025 Bahar", 1);
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.updateCourse(1, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Pasif ders");

        verify(courseRepository, never()).save(any());
    }

    @Test
    void updateCourse_duplicateCourseCode_throwsConflict() {
        CourseUpdateRequest request = new CourseUpdateRequest("CENG 999", "Başka Ders", "2024-2025 Bahar", 1);
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(courseRepository.existsByOwnerAcademician_UserIdAndCourseCodeAndCourseIdNot(10, "CENG 999", 1))
                .thenReturn(true);

        assertThatThrownBy(() -> courseService.updateCourse(1, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ders kodu");

        verify(courseRepository, never()).save(any());
    }
}
