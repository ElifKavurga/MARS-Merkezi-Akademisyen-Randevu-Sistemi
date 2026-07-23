package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.admin.SchedulerStatusDto;
import com.mars.service.SchedulerRegistry;
import com.mars.service.SchedulerRunResult;

import lombok.RequiredArgsConstructor;

/**
 * Admin-only endpoint to retrieve the current status of all registered schedulers.
 */
@RestController
@RequestMapping("/admin/scheduler-status")
@RequiredArgsConstructor
public class AdminSchedulerStatusController {

    private final SchedulerRegistry schedulerRegistry;

    @GetMapping
    public ResponseEntity<List<SchedulerStatusDto>> getSchedulerStatuses() {
        List<SchedulerStatusDto> statuses = schedulerRegistry.getAll()
                .stream()
                .map(this::toDto)
                .sorted(java.util.Comparator.comparing(SchedulerStatusDto::schedulerName))
                .toList();
        return ResponseEntity.ok(statuses);
    }

    private SchedulerStatusDto toDto(SchedulerRunResult result) {
        return new SchedulerStatusDto(
                result.schedulerName(),
                result.lastRunAt(),
                result.lastSuccessAt(),
                result.durationMs(),
                result.processed(),
                result.updated(),
                result.skipped(),
                result.errors(),
                result.status().name()
        );
    }
}
