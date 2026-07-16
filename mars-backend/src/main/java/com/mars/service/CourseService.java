package com.mars.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.CourseAssistantResponseDto;
import com.mars.dto.CourseCreateRequest;
import com.mars.dto.CourseResponseDto;
import com.mars.dto.CourseUpdateRequest;
import com.mars.entity.Course;
import com.mars.entity.Department;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.CourseAssignmentMapper;
import com.mars.mapper.CourseMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.repository.CourseRepository;
import com.mars.repository.DepartmentRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CourseService {

    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name());

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final CourseAssignmentRepository courseAssignmentRepository;
    private final CourseMapper courseMapper;
    private final CourseAssignmentMapper courseAssignmentMapper;

    @Transactional(readOnly = true)
    public List<CourseResponseDto> getMyCourses() {
        User currentUser = getCurrentUser();
        return courseRepository
                .findByOwnerAcademician_UserIdOrderByCourseNameAsc(currentUser.getUserId())
                .stream()
                .map(courseMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseResponseDto getMyCourse(Integer courseId) {
        User currentUser = getCurrentUser();
        Course course = getOwnedCourse(courseId, currentUser, "Bu dersi görüntüleme yetkiniz yok.");
        return courseMapper.toResponse(course);
    }

    @Transactional(readOnly = true)
    public List<CourseAssistantResponseDto> getCourseAssistants(Integer courseId) {
        User currentUser = getCurrentUser();
        getOwnedCourse(courseId, currentUser, "Bu dersin asistanlarını görüntüleme yetkiniz yok.");
        return courseAssignmentRepository.findActiveAssistantsByCourseId(courseId).stream()
                .map(courseAssignmentMapper::toAssistantResponse)
                .toList();
    }

    @Transactional
    public CourseResponseDto createCourse(CourseCreateRequest request) {
        User currentUser = getCurrentUser();
        String courseCode = request.getCourseCode().trim();

        if (courseRepository.existsByOwnerAcademician_UserIdAndCourseCode(currentUser.getUserId(), courseCode)) {
            throw new ConflictException("Bu ders kodu ile zaten bir ders kayıtlı.");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Bölüm bulunamadı."));

        Course course = courseMapper.toEntity(request, department, currentUser);
        Course saved = courseRepository.save(course);
        return courseMapper.toResponse(saved);
    }

    @Transactional
    public CourseResponseDto updateCourse(Integer courseId, CourseUpdateRequest request) {
        User currentUser = getCurrentUser();
        Course course = getOwnedActiveCourse(courseId, currentUser, "Bu dersi güncelleme yetkiniz yok.");

        String courseCode = request.getCourseCode().trim();
        if (courseRepository.existsByOwnerAcademician_UserIdAndCourseCodeAndCourseIdNot(
                currentUser.getUserId(), courseCode, courseId)) {
            throw new ConflictException("Bu ders kodu ile zaten bir ders kayıtlı.");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Bölüm bulunamadı."));

        courseMapper.updateEntity(course, request, department);
        Course saved = courseRepository.save(course);
        return courseMapper.toResponse(saved);
    }

    @Transactional
    public CourseResponseDto changeCourseStatus(Integer courseId) {
        User currentUser = getCurrentUser();
        Course course = getOwnedCourse(courseId, currentUser, "Bu dersin durumunu değiştirme yetkiniz yok.");

        if (Boolean.TRUE.equals(course.getIsActive())) {
            deactivateCourse(course);
        } else {
            activateCourse(course);
        }

        course.setUpdatedAt(LocalDateTime.now());
        Course saved = courseRepository.save(course);
        return courseMapper.toResponse(saved);
    }

    private void deactivateCourse(Course course) {
        if (appointmentRepository.existsByCourse_CourseIdAndAppointmentStatusIn(
                course.getCourseId(), ACTIVE_APPOINTMENT_STATUSES)) {
            throw new ConflictException("Bu derse ait aktif randevular bulunduğu için ders pasifleştirilemez.");
        }

        if (appointmentRepository.existsByCourse_CourseIdAndSlot_IsBlockedFalse(course.getCourseId())) {
            throw new ConflictException("Bu derse ait aktif ofis saatleri bulunduğu için ders pasifleştirilemez.");
        }

        course.setIsActive(false);
    }

    private void activateCourse(Course course) {
        if (Boolean.TRUE.equals(course.getIsActive())) {
            throw new BadRequestException("Bu ders zaten aktif.");
        }
        course.setIsActive(true);
    }

    private Course getOwnedActiveCourse(Integer courseId, User currentUser, String accessDeniedMessage) {
        Course course = getOwnedCourse(courseId, currentUser, accessDeniedMessage);
        if (!Boolean.TRUE.equals(course.getIsActive())) {
            throw new BadRequestException("Pasif ders güncellenemez.");
        }
        return course;
    }

    private Course getOwnedCourse(Integer courseId, User currentUser, String accessDeniedMessage) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Ders bulunamadı."));

        if (course.getOwnerAcademician() == null
                || !Objects.equals(course.getOwnerAcademician().getUserId(), currentUser.getUserId())) {
            throw new AccessDeniedException(accessDeniedMessage);
        }

        return course;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return userDetails.getUser();
    }
}
