package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AssistantCourseResponseDto;
import com.mars.service.AssistantCourseService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/assistant/courses")
@RequiredArgsConstructor
public class AssistantCourseController {

    private final AssistantCourseService assistantCourseService;

    @GetMapping
    public ResponseEntity<List<AssistantCourseResponseDto>> getAssignedCourses() {
        return ResponseEntity.ok(assistantCourseService.getAssignedCourses());
    }
}
