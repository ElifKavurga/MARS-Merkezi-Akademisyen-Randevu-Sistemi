package com.mars.service;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.AppointmentMessages;
import com.mars.StudentAcademicianMessages;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.PageResponseDto;
import com.mars.dto.StudentAcademicianCourseDto;
import com.mars.dto.StudentAcademicianDetailResponseDto;
import com.mars.dto.StudentAcademicianResponseDto;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.Course;
import com.mars.entity.User;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.UserMapper;
import com.mars.repository.AppointmentCategoryRepository;
import com.mars.repository.CourseRepository;
import com.mars.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentAcademicianService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final String SORT_NAME_ASC = "NAME_ASC";
    private static final String SORT_NAME_DESC = "NAME_DESC";

    private static final List<String> ACADEMICIAN_ROLE_NAMES = List.of(
            RoleType.ACADEMICIAN.name(),
            RoleType.HOD.name());

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final AppointmentCategoryRepository appointmentCategoryRepository;
    private final UserMapper userMapper;
    private final AvailabilitySlotService availabilitySlotService;

    @Transactional(readOnly = true)
    public PageResponseDto<StudentAcademicianResponseDto> searchAcademicians(
            String search,
            Integer departmentId,
            String academicTitle,
            Boolean isAcceptingAppointments,
            String sort,
            int page,
            int size) {
        if (page < 0) {
            throw new BadRequestException(StudentAcademicianMessages.INVALID_PAGE);
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException(StudentAcademicianMessages.INVALID_PAGE_SIZE);
        }

        String normalizedSearch = blankToNull(search);
        String normalizedTitle = blankToNull(academicTitle);
        Sort nameSort = resolveSort(sort);
        Pageable pageable = PageRequest.of(page, size, nameSort);

        Page<User> result = userRepository.searchActiveAcademicians(
                ACADEMICIAN_ROLE_NAMES,
                normalizedSearch,
                departmentId,
                normalizedTitle,
                isAcceptingAppointments,
                pageable);

        List<StudentAcademicianResponseDto> content = result.getContent().stream()
                .map(userMapper::toStudentAcademicianResponse)
                .toList();

        return PageResponseDto.<StudentAcademicianResponseDto>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .first(result.isFirst())
                .last(result.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<String> listAcademicTitles() {
        return userRepository.findDistinctAcademicTitles(ACADEMICIAN_ROLE_NAMES);
    }

    @Transactional(readOnly = true)
    public StudentAcademicianDetailResponseDto getAcademicianDetail(Integer userId) {
        User academician = requireActiveAcademician(userId);

        List<StudentAcademicianCourseDto> courses = courseRepository
                .findByOwnerAcademician_UserIdAndIsActiveTrueOrderByCourseNameAsc(userId)
                .stream()
                .map(userMapper::toStudentAcademicianCourse)
                .toList();

        return userMapper.toStudentAcademicianDetail(academician, courses);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponseDto> getAcademicianAvailability(Integer userId) {
        requireActiveAcademician(userId);
        return availabilitySlotService.getAvailableSlotsForStaff(userId);
    }

    @Transactional(readOnly = true)
    public List<StudentAcademicianCourseDto> listAcademicianCourses(Integer userId) {
        requireActiveAcademician(userId);
        return courseRepository
                .findByOwnerAcademician_UserIdAndIsActiveTrueOrderByCourseNameAsc(userId)
                .stream()
                .map(userMapper::toStudentAcademicianCourse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponseDto> listAvailableSlots(
            Integer academicianId,
            Integer categoryId,
            Integer courseId) {
        log.info(
                "available-slots request AcademicianId={} CategoryId={} CourseId={}",
                academicianId,
                categoryId,
                courseId);

        User academician = requireActiveAcademician(academicianId);
        AppointmentCategory category = requireCategory(categoryId);
        validateCourseSelection(courseId, category, academician);

        List<AvailableSlotResponseDto> result = availabilitySlotService.getBookableAvailableSlotsForStaff(
                academicianId, category.getDurationMinutes());
        log.info(
                "available-slots Final response count={} (AcademicianId={})",
                result.size(),
                academicianId);
        return result;
    }

    private AppointmentCategory requireCategory(Integer categoryId) {
        if (categoryId == null || categoryId < 1) {
            throw new BadRequestException(AppointmentMessages.CATEGORY_REQUIRED);
        }
        return appointmentCategoryRepository
                .findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.CATEGORY_NOT_FOUND));
    }

    private void validateCourseSelection(
            Integer courseId, AppointmentCategory category, User academician) {
        boolean requiresCourse = Boolean.TRUE.equals(category.getRequiresCourseSelection());
        if (requiresCourse) {
            if (courseId == null || courseId < 1) {
                throw new BadRequestException(AppointmentMessages.COURSE_REQUIRED);
            }
            Course course = courseRepository
                    .findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.COURSE_NOT_FOUND));
            if (course.getOwnerAcademician() == null
                    || !Objects.equals(course.getOwnerAcademician().getUserId(), academician.getUserId())) {
                throw new BadRequestException(AppointmentMessages.COURSE_STAFF_MISMATCH);
            }
            if (!Boolean.TRUE.equals(course.getIsActive())) {
                throw new BadRequestException(AppointmentMessages.COURSE_NOT_FOUND);
            }
            return;
        }
        if (courseId != null) {
            throw new BadRequestException(AppointmentMessages.COURSE_NOT_ALLOWED);
        }
    }

    private User requireActiveAcademician(Integer userId) {
        if (userId == null || userId < 1) {
            throw new BadRequestException(StudentAcademicianMessages.INVALID_ACADEMICIAN_ID);
        }
        return userRepository
                .findActiveAcademicianById(userId, ACADEMICIAN_ROLE_NAMES)
                .orElseThrow(() -> new ResourceNotFoundException(StudentAcademicianMessages.ACADEMICIAN_NOT_FOUND));
    }

    private static Sort resolveSort(String sort) {
        String normalized = sort == null || sort.isBlank()
                ? SORT_NAME_ASC
                : sort.trim().toUpperCase(Locale.ROOT);
        if (SORT_NAME_DESC.equals(normalized)) {
            return Sort.by(Sort.Direction.DESC, "fullName");
        }
        if (SORT_NAME_ASC.equals(normalized)) {
            return Sort.by(Sort.Direction.ASC, "fullName");
        }
        throw new BadRequestException(StudentAcademicianMessages.INVALID_SORT);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
