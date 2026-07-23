package com.mars.service;

import java.util.Collection;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Central in-memory registry that holds the latest {@link SchedulerRunResult}
 * for every known scheduler.
 *
 * <p>This bean is thread-safe: concurrent reads and writes are handled by a
 * {@link ConcurrentHashMap}.  The registry is populated by
 * {@link SchedulerMonitor.SchedulerRunContext#finish()} after each scheduler
 * run, so no database query or recalculation is needed.
 */
@Component
public class SchedulerRegistry {

    private final ConcurrentHashMap<String, SchedulerRunResult> store = new ConcurrentHashMap<>();

    /**
     * Records (or replaces) the result of a scheduler run.
     *
     * @param result the run result; must not be {@code null}
     */
    public void register(SchedulerRunResult result) {
        store.put(result.schedulerName(), result);
    }

    /**
     * Returns all stored scheduler results (one per scheduler name).
     *
     * @return unmodifiable snapshot of the current registry values
     */
    public Collection<SchedulerRunResult> getAll() {
        return store.values();
    }
}
