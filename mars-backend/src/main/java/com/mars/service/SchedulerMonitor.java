package com.mars.service;

import java.time.LocalDateTime;
import java.time.ZoneId;

import org.slf4j.Logger;

import com.mars.service.SchedulerRunResult.SchedulerStatus;

/**
 * Centralized scheduler monitoring utility.
 *
 * <p>Provides a {@link SchedulerRunContext} that tracks timing and counters,
 * writes a single structured log line at the end of each scheduler run, and
 * optionally pushes the result to a {@link SchedulerRegistry} for the admin
 * status dashboard.
 *
 * <p>Usage (without registry, e.g. in unit tests):
 * <pre>{@code
 * SchedulerMonitor.SchedulerRunContext ctx = SchedulerMonitor.start(LOGGER, "MyScheduler");
 * ctx.incrementProcessed();
 * ctx.finish();
 * }</pre>
 *
 * <p>Usage (with registry injection via scheduler constructor):
 * <pre>{@code
 * SchedulerMonitor.SchedulerRunContext ctx =
 *     SchedulerMonitor.start(LOGGER, "MyScheduler", schedulerRegistry);
 * ctx.finish();
 * }</pre>
 */
public final class SchedulerMonitor {

    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");

    private SchedulerMonitor() {}

    /**
     * Starts a new scheduler run context without registry integration.
     * Suitable for unit tests and schedulers that do not expose status data.
     */
    public static SchedulerRunContext start(Logger logger, String schedulerName) {
        return new SchedulerRunContext(logger, schedulerName, null);
    }

    /**
     * Starts a new scheduler run context with optional registry integration.
     * When {@code registry} is non-null, {@link SchedulerRunContext#finish()}
     * will push the run result to the registry.
     */
    public static SchedulerRunContext start(Logger logger, String schedulerName,
            SchedulerRegistry registry) {
        return new SchedulerRunContext(logger, schedulerName, registry);
    }

    /** Mutable run context that accumulates metrics for a single scheduler execution. */
    public static final class SchedulerRunContext {

        private final Logger logger;
        private final String schedulerName;
        private final SchedulerRegistry registry;
        private final long startNanos;
        private final LocalDateTime startedAt;

        private int processed = 0;
        private int updated   = 0;
        private int skipped   = 0;
        private int errors    = 0;

        private SchedulerRunContext(Logger logger, String schedulerName, SchedulerRegistry registry) {
            this.logger        = logger;
            this.schedulerName = schedulerName;
            this.registry      = registry;
            this.startNanos    = System.nanoTime();
            this.startedAt     = LocalDateTime.now(APP_ZONE);
            logger.info("[{}] Starting scheduler run.", schedulerName);
        }

        public void incrementProcessed() { processed++; }
        public void incrementUpdated()   { updated++;   }
        public void incrementSkipped()   { skipped++;   }
        public void incrementErrors()    { errors++;    }

        public void addProcessed(int n)  { processed += n; }
        public void addUpdated(int n)    { updated   += n; }
        public void addSkipped(int n)    { skipped   += n; }
        public void addErrors(int n)     { errors    += n; }

        public int getProcessed() { return processed; }
        public int getUpdated()   { return updated;   }
        public int getSkipped()   { return skipped;   }
        public int getErrors()    { return errors;    }

        /**
         * Finalises the run: computes elapsed time, writes a structured log line,
         * and (if a registry was provided) pushes a {@link SchedulerRunResult}.
         */
        public void finish() {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            LocalDateTime now = LocalDateTime.now(APP_ZONE);

            SchedulerStatus status = resolveStatus();

            String msg = "[{}] Completed. duration={}ms processed={} updated={} skipped={} errors={}";
            if (errors > 0) {
                logger.warn(msg, schedulerName, durationMs, processed, updated, skipped, errors);
            } else {
                logger.info(msg, schedulerName, durationMs, processed, updated, skipped, errors);
            }

            if (registry != null) {
                LocalDateTime lastSuccess = (status == SchedulerStatus.SUCCESS) ? now : null;
                registry.register(new SchedulerRunResult(
                        schedulerName,
                        now,
                        lastSuccess,
                        durationMs,
                        processed,
                        updated,
                        skipped,
                        errors,
                        status
                ));
            }
        }

        private SchedulerStatus resolveStatus() {
            if (errors > 0 && processed == 0) {
                return SchedulerStatus.FAILED;
            } else if (errors > 0) {
                return SchedulerStatus.WARNING;
            } else {
                return SchedulerStatus.SUCCESS;
            }
        }
    }
}
