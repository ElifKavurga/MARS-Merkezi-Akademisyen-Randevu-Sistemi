package com.mars.dto.admin;

import java.time.LocalDateTime;

/**
 * DTO returned by {@code GET /admin/scheduler-status}.
 * Maps one-to-one with {@link com.mars.service.SchedulerRunResult}.
 */
public record SchedulerStatusDto(
        String schedulerName,
        LocalDateTime lastRunAt,
        LocalDateTime lastSuccessAt,
        long durationMs,
        int processed,
        int updated,
        int skipped,
        int errors,
        String status) {
}
