package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.HodAcademicianListDto;
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
}
