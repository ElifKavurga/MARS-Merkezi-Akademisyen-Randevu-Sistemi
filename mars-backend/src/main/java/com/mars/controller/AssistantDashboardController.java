package com.mars.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AssistantDashboardResponseDto;
import com.mars.service.AssistantCourseService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/assistant/dashboard")
@RequiredArgsConstructor
public class AssistantDashboardController {

    private final AssistantCourseService assistantCourseService;

    @GetMapping
    public ResponseEntity<AssistantDashboardResponseDto> getDashboardSummary() {
        return ResponseEntity.ok(assistantCourseService.getDashboardSummary());
    }
}
