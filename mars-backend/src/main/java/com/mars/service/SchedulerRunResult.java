package com.mars.service;

import java.time.LocalDateTime;

/**
 * Immutable snapshot of a single scheduler run result.
 * Produced by {@link SchedulerMonitor.SchedulerRunContext#finish()} and stored
 * in {@link SchedulerRegistry} for the status dashboard.
 */
public record SchedulerRunResult(
        String schedulerName,
        LocalDateTime lastRunAt,
        LocalDateTime lastSuccessAt,
        long durationMs,
        int processed,
        int updated,
        int skipped,
        int errors,
        SchedulerStatus status) {

    /** Represents the operational status of a single scheduler run. */
    public enum SchedulerStatus {
        RUNNING,
        SUCCESS,
        WARNING,
        FAILED
    }
}
