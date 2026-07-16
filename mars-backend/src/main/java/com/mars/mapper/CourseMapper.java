package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.CourseResponseDto;
import com.mars.entity.Course;
import com.mars.entity.Department;

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
                .build();
    }
}
