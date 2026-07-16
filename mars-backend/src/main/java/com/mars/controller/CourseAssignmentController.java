package com.mars.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.CourseAssignmentUpdateRequest;
import com.mars.dto.CourseAssistantResponseDto;
import com.mars.service.CourseAssignmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/course-assignments")
@RequiredArgsConstructor
public class CourseAssignmentController {

    private final CourseAssignmentService courseAssignmentService;

    @PutMapping("/{assignmentId}")
    public ResponseEntity<CourseAssistantResponseDto> updateAssignment(
            @PathVariable Integer assignmentId,
            @Valid @RequestBody CourseAssignmentUpdateRequest request) {
        return ResponseEntity.ok(courseAssignmentService.updateAssignment(assignmentId, request));
    }

    @PatchMapping("/{assignmentId}/remove")
    public ResponseEntity<Void> removeAssignment(@PathVariable Integer assignmentId) {
        courseAssignmentService.removeAssignment(assignmentId);
        return ResponseEntity.noContent().build();
    }
}
