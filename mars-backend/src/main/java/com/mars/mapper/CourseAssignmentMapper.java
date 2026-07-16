package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.CourseAssistantResponseDto;
import com.mars.entity.CourseAssignment;
import com.mars.entity.Department;
import com.mars.entity.User;

@Component
public class CourseAssignmentMapper {

    public CourseAssistantResponseDto toAssistantResponse(CourseAssignment assignment) {
        User assistant = assignment.getAssistant();
        Department department = assistant != null ? assistant.getDepartment() : null;

        return CourseAssistantResponseDto.builder()
                .assignmentId(assignment.getCourseAssignmentId())
                .assistantId(assistant != null ? assistant.getUserId() : null)
                .assistantName(assistant != null ? assistant.getFullName() : null)
                .institutionalEmail(assistant != null ? assistant.getInstitutionalEmail() : null)
                .departmentName(department != null ? department.getDepartmentName() : null)
                .build();
    }
}
