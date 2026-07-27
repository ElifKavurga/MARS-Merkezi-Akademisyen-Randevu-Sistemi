package com.mars.mapper;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.mars.dto.CourseAssistantResponseDto;
import com.mars.entity.Course;
import com.mars.entity.CourseAssignment;
import com.mars.entity.Department;
import com.mars.entity.User;

@Component
public class CourseAssignmentMapper {

    public CourseAssignment toEntity(Course course, User assistant) {
        CourseAssignment assignment = new CourseAssignment();
        assignment.setCourse(course);
        assignment.setAssistant(assistant);
        assignment.setAssignedAt(LocalDateTime.now());
        return assignment;
    }

    public CourseAssistantResponseDto toAssistantResponse(CourseAssignment assignment) {
        User assistant = assignment.getAssistant();
        Department department = assistant != null ? assistant.getDepartment() : null;

        return CourseAssistantResponseDto.builder()
                .assignmentId(assignment.getCourseAssignmentId())
                .assistantId(assistant != null ? assistant.getUserId() : null)
                .assistantName(assistant != null ? assistant.getDisplayName() : null)
                .institutionalEmail(assistant != null ? assistant.getInstitutionalEmail() : null)
                .departmentName(department != null ? department.getDepartmentName() : null)
                .assignedAt(assignment.getAssignedAt())
                .build();
    }
}
