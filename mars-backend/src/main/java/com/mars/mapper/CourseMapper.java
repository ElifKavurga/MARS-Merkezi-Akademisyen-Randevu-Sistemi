package com.mars.mapper;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.mars.dto.CourseCreateRequest;
import com.mars.dto.CourseResponseDto;
import com.mars.dto.CourseUpdateRequest;
import com.mars.entity.Course;
import com.mars.entity.Department;
import com.mars.entity.User;

@Component
public class CourseMapper {

    public CourseResponseDto toResponse(Course course) {
        Department department = course.getDepartment();
        return CourseResponseDto.builder()
                .courseId(course.getCourseId())
                .courseCode(course.getCourseCode())
                .courseName(course.getCourseName())
                .academicTerm(course.getAcademicTerm())
                .departmentId(department != null ? department.getDepartmentId() : null)
                .departmentName(department != null ? department.getDepartmentName() : null)
                .isActive(Boolean.TRUE.equals(course.getIsActive()))
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }

    public Course toEntity(CourseCreateRequest request, Department department, User ownerAcademician) {
        LocalDateTime now = LocalDateTime.now();
        Course course = new Course();
        course.setCourseCode(request.getCourseCode().trim());
        course.setCourseName(request.getCourseName().trim());
        course.setAcademicTerm(request.getAcademicTerm().trim());
        course.setDepartment(department);
        course.setOwnerAcademician(ownerAcademician);
        course.setIsActive(true);
        course.setCreatedAt(now);
        course.setUpdatedAt(now);
        return course;
    }

    public void updateEntity(Course course, CourseUpdateRequest request, Department department) {
        course.setCourseCode(request.getCourseCode().trim());
        course.setCourseName(request.getCourseName().trim());
        course.setAcademicTerm(request.getAcademicTerm().trim());
        course.setDepartment(department);
        course.setUpdatedAt(LocalDateTime.now());
    }
}
