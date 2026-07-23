package com.mars.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Centralized scheduler monitoring utility.
 * Provides a {@link SchedulerRunContext} that tracks timing and counters,
 * then writes a single structured log line at the end of each scheduler run.
 *
 * <p>Usage:
 * <pre>{@code
 * SchedulerMonitor.SchedulerRunContext ctx = SchedulerMonitor.start(LOGGER, "MyScheduler");
 * ctx.incrementProcessed();
 * ctx.incrementUpdated();
 * ctx.finish();
 * }</pre>
 */
public final class SchedulerMonitor {

    private SchedulerMonitor() {}

    /**
     * Starts a new scheduler run context.
     *
     * @param logger        the SLF4J logger of the calling scheduler
     * @param schedulerName human-readable name for log output
     * @return a new {@link SchedulerRunContext}
     */
    public static SchedulerRunContext start(Logger logger, String schedulerName) {
        return new SchedulerRunContext(logger, schedulerName);
    }

    /**
     * Mutable run context that accumulates metrics for a single scheduler execution.
     */
    public static final class SchedulerRunContext {

        private final Logger logger;
        private final String schedulerName;
        private final long startNanos;

        private int processed = 0;
        private int updated   = 0;
        private int skipped   = 0;
        private int errors    = 0;

        private SchedulerRunContext(Logger logger, String schedulerName) {
            this.logger        = logger;
            this.schedulerName = schedulerName;
            this.startNanos    = System.nanoTime();
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
         * Finalises the run, computes elapsed time and writes a structured log line.
         * If any errors occurred the line is written at WARN level; otherwise at INFO.
         */
        public void finish() {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            String msg = "[{}] Completed. duration={}ms processed={} updated={} skipped={} errors={}";
            if (errors > 0) {
                logger.warn(msg, schedulerName, durationMs, processed, updated, skipped, errors);
            } else {
                logger.info(msg, schedulerName, durationMs, processed, updated, skipped, errors);
            }
        }
    }
}
