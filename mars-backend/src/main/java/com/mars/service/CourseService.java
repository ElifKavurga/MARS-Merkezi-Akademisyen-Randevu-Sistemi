package com.mars.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.CourseCreateRequest;
import com.mars.dto.CourseResponseDto;
import com.mars.entity.Course;
import com.mars.entity.Department;
import com.mars.entity.User;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.CourseMapper;
import com.mars.repository.CourseRepository;
import com.mars.repository.DepartmentRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseMapper courseMapper;

    @Transactional(readOnly = true)
    public List<CourseResponseDto> getMyCourses() {
        User currentUser = getCurrentUser();
        return courseRepository.findByOwnerAcademician_UserIdOrderByCourseNameAsc(currentUser.getUserId())
                .stream()
                .map(courseMapper::toResponse)
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

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return userDetails.getUser();
    }
}
