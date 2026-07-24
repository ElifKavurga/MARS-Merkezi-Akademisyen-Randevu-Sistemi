package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.PathVariable;

import com.mars.dto.HodAcademicianDetailDto;
import com.mars.dto.HodAcademicianListDto;
import com.mars.dto.HodAcademicianStatsDto;
import com.mars.security.CustomUserDetails;
import com.mars.service.HodService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/hod")
@RequiredArgsConstructor
public class HodController {

    private final HodService hodService;

    @GetMapping("/academicians")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<HodAcademicianListDto>> getDepartmentAcademicians(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<HodAcademicianListDto> academicians = hodService.getDepartmentAcademicians(userDetails.getUser().getUserId());
        return ResponseEntity.ok(academicians);
    }

    @GetMapping("/academicians/{userId}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<HodAcademicianDetailDto> getDepartmentAcademicianDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer userId) {
        HodAcademicianDetailDto academician = hodService.getDepartmentAcademicianDetail(
                userDetails.getUser().getUserId(), userId);
        return ResponseEntity.ok(academician);
    }

    @GetMapping("/academicians/{userId}/stats")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<HodAcademicianStatsDto> getDepartmentAcademicianStats(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer userId) {
        HodAcademicianStatsDto stats = hodService.getDepartmentAcademicianStats(
                userDetails.getUser().getUserId(), userId);
        return ResponseEntity.ok(stats);
    }
}

