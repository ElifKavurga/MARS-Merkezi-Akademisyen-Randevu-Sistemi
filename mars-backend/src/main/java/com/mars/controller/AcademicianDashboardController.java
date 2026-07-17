package com.mars.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AcademicianDashboardResponseDto;
import com.mars.service.AcademicianDashboardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/academician/dashboard")
@RequiredArgsConstructor
public class AcademicianDashboardController {

    private final AcademicianDashboardService academicianDashboardService;

    @GetMapping
    public ResponseEntity<AcademicianDashboardResponseDto> getDashboardSummary() {
        return ResponseEntity.ok(academicianDashboardService.getDashboardSummary());
    }
}
