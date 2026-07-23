package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collection;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.mars.service.SchedulerRunResult.SchedulerStatus;

class SchedulerRegistryTest {

    private SchedulerRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new SchedulerRegistry();
    }

    @Test
    void emptyRegistry_returnsEmptyCollection() {
        assertThat(registry.getAll()).isEmpty();
    }

    @Test
    void register_singleResult_isRetrievable() {
        SchedulerRunResult result = successResult("Scheduler-A");
        registry.register(result);

        Collection<SchedulerRunResult> all = registry.getAll();
        assertThat(all).hasSize(1);
        assertThat(all.iterator().next().schedulerName()).isEqualTo("Scheduler-A");
    }

    @Test
    void register_sameName_overwritesPrevious() {
        registry.register(successResult("Scheduler-A"));
        SchedulerRunResult updated = new SchedulerRunResult(
                "Scheduler-A", null, null, 99L, 5, 4, 1, 0, SchedulerStatus.SUCCESS);
        registry.register(updated);

        assertThat(registry.getAll()).hasSize(1);
        assertThat(registry.getAll().iterator().next().durationMs()).isEqualTo(99L);
    }

    @Test
    void register_multipleNames_allRetrievable() {
        registry.register(successResult("Scheduler-A"));
        registry.register(successResult("Scheduler-B"));
        registry.register(successResult("Scheduler-C"));

        assertThat(registry.getAll()).hasSize(3);
    }

    @Test
    void schedulerMonitor_finish_populatesRegistry() {
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(SchedulerRegistryTest.class);
        SchedulerMonitor.SchedulerRunContext ctx =
                SchedulerMonitor.start(logger, "TestScheduler", registry);
        ctx.addProcessed(3);
        ctx.addUpdated(2);
        ctx.finish();

        assertThat(registry.getAll()).hasSize(1);
        SchedulerRunResult stored = registry.getAll().iterator().next();
        assertThat(stored.schedulerName()).isEqualTo("TestScheduler");
        assertThat(stored.processed()).isEqualTo(3);
        assertThat(stored.updated()).isEqualTo(2);
        assertThat(stored.status()).isEqualTo(SchedulerStatus.SUCCESS);
    }

    @Test
    void schedulerMonitor_withErrors_storesWarningStatus() {
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(SchedulerRegistryTest.class);
        SchedulerMonitor.SchedulerRunContext ctx =
                SchedulerMonitor.start(logger, "ErrorScheduler", registry);
        ctx.addProcessed(5);
        ctx.addUpdated(4);
        ctx.incrementErrors();
        ctx.finish();

        SchedulerRunResult stored = registry.getAll().iterator().next();
        assertThat(stored.status()).isEqualTo(SchedulerStatus.WARNING);
    }

    @Test
    void schedulerMonitor_onlyErrors_storesFailedStatus() {
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(SchedulerRegistryTest.class);
        SchedulerMonitor.SchedulerRunContext ctx =
                SchedulerMonitor.start(logger, "FailedScheduler", registry);
        ctx.incrementErrors();
        ctx.finish();

        SchedulerRunResult stored = registry.getAll().iterator().next();
        assertThat(stored.status()).isEqualTo(SchedulerStatus.FAILED);
    }

    private static SchedulerRunResult successResult(String name) {
        return new SchedulerRunResult(name, null, null, 10L, 0, 0, 0, 0, SchedulerStatus.SUCCESS);
    }
}
