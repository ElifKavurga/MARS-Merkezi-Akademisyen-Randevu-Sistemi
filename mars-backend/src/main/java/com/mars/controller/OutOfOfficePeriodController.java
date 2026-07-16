package com.mars.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.OutOfOfficePeriodCreateRequest;
import com.mars.dto.OutOfOfficePeriodResponseDto;
import com.mars.dto.OutOfOfficePeriodUpdateRequest;
import com.mars.service.OutOfOfficePeriodService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/out-of-office")
@RequiredArgsConstructor
public class OutOfOfficePeriodController {

    private final OutOfOfficePeriodService outOfOfficePeriodService;

    @GetMapping("/my")
    public ResponseEntity<List<OutOfOfficePeriodResponseDto>> getMyPeriods() {
        return ResponseEntity.ok(outOfOfficePeriodService.getMyPeriods());
    }

    @PostMapping
    public ResponseEntity<OutOfOfficePeriodResponseDto> createPeriod(
            @Valid @RequestBody OutOfOfficePeriodCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(outOfOfficePeriodService.createPeriod(request));
    }

    @PutMapping("/{outOfOfficeId}")
    public ResponseEntity<OutOfOfficePeriodResponseDto> updatePeriod(
            @PathVariable Integer outOfOfficeId,
            @Valid @RequestBody OutOfOfficePeriodUpdateRequest request) {
        return ResponseEntity.ok(outOfOfficePeriodService.updatePeriod(outOfOfficeId, request));
    }

    @PatchMapping("/{outOfOfficeId}/end")
    public ResponseEntity<OutOfOfficePeriodResponseDto> endPeriod(@PathVariable Integer outOfOfficeId) {
        return ResponseEntity.ok(outOfOfficePeriodService.endPeriod(outOfOfficeId));
    }
}
