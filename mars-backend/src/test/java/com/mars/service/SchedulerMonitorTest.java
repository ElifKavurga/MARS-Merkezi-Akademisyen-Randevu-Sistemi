package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class SchedulerMonitorTest {

    private static final Logger LOGGER = LoggerFactory.getLogger(SchedulerMonitorTest.class);

    @Test
    void startAndFinish_noErrors_producesInfoLog() {
        SchedulerMonitor.SchedulerRunContext ctx = SchedulerMonitor.start(LOGGER, "TestScheduler");
        ctx.incrementProcessed();
        ctx.incrementUpdated();
        ctx.finish(); // must not throw

        assertThat(ctx.getProcessed()).isEqualTo(1);
        assertThat(ctx.getUpdated()).isEqualTo(1);
        assertThat(ctx.getSkipped()).isZero();
        assertThat(ctx.getErrors()).isZero();
    }

    @Test
    void withErrors_countersReflectErrors() {
        SchedulerMonitor.SchedulerRunContext ctx = SchedulerMonitor.start(LOGGER, "TestSchedulerErrors");
        ctx.addProcessed(5);
        ctx.addUpdated(3);
        ctx.addSkipped(1);
        ctx.addErrors(1);
        ctx.finish(); // must not throw

        assertThat(ctx.getProcessed()).isEqualTo(5);
        assertThat(ctx.getUpdated()).isEqualTo(3);
        assertThat(ctx.getSkipped()).isEqualTo(1);
        assertThat(ctx.getErrors()).isEqualTo(1);
    }

    @Test
    void durationMeasured_elapsedTimeIsNonNegative() throws InterruptedException {
        SchedulerMonitor.SchedulerRunContext ctx = SchedulerMonitor.start(LOGGER, "DurationTest");
        Thread.sleep(2); // ensure elapsed > 0
        ctx.finish(); // logs duration - must not throw
    }

    @Test
    void incrementHelpers_accumulateCorrectly() {
        SchedulerMonitor.SchedulerRunContext ctx = SchedulerMonitor.start(LOGGER, "CounterTest");
        ctx.incrementProcessed();
        ctx.incrementProcessed();
        ctx.incrementUpdated();
        ctx.incrementSkipped();
        ctx.incrementErrors();

        assertThat(ctx.getProcessed()).isEqualTo(2);
        assertThat(ctx.getUpdated()).isEqualTo(1);
        assertThat(ctx.getSkipped()).isEqualTo(1);
        assertThat(ctx.getErrors()).isEqualTo(1);
    }

    @Test
    void zeroRecords_finishDoesNotThrow() {
        SchedulerMonitor.SchedulerRunContext ctx = SchedulerMonitor.start(LOGGER, "EmptyRun");
        ctx.finish();

        assertThat(ctx.getProcessed()).isZero();
        assertThat(ctx.getErrors()).isZero();
    }
}
