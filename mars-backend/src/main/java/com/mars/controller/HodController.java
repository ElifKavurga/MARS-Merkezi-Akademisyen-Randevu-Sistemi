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
import com.mars.dto.HodPerformanceSummaryDto;
import com.mars.dto.HodRecentAppointmentDto;
import com.mars.security.CustomUserDetails;
import com.mars.service.HodService;

import com.mars.dto.CalendarEventResponseDto;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

@RestController
@RequestMapping("/hod")

public class HodController {
    public HodController(HodService hodService) {
        this.hodService = hodService;
    }

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

    @GetMapping("/academicians/{userId}/calendar")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<CalendarEventResponseDto>> getDepartmentAcademicianCalendar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer userId,
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to,
            @RequestParam(defaultValue = "false") boolean includeAppointments) {
        List<CalendarEventResponseDto> events = hodService.getDepartmentAcademicianCalendar(
                userDetails.getUser().getUserId(), userId, from, to, includeAppointments);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/academicians/{userId}/recent-appointments")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<HodRecentAppointmentDto>> getDepartmentAcademicianRecentAppointments(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer userId) {
        List<HodRecentAppointmentDto> appointments = hodService.getDepartmentAcademicianRecentAppointments(
                userDetails.getUser().getUserId(), userId);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/academicians/{userId}/performance")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<HodPerformanceSummaryDto> getDepartmentAcademicianPerformanceSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer userId) {
        HodPerformanceSummaryDto summary = hodService.getDepartmentAcademicianPerformanceSummary(
                userDetails.getUser().getUserId(), userId);
        return ResponseEntity.ok(summary);
    }

}
