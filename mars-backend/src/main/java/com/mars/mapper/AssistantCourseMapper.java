package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.AssistantCourseResponseDto;
import com.mars.entity.Course;
import com.mars.entity.CourseAssignment;
import com.mars.entity.User;

@Component
public class AssistantCourseMapper {

    public AssistantCourseResponseDto toResponse(CourseAssignment assignment) {
        Course course = assignment.getCourse();
        User owner = course.getOwnerAcademician();

        return AssistantCourseResponseDto.builder()
                .courseId(course.getCourseId())
                .courseCode(course.getCourseCode())
                .courseName(course.getCourseName())
                .academicTerm(course.getAcademicTerm())
                .ownerAcademicianName(owner != null ? owner.getFullName() : null)
                .build();
    }
}
