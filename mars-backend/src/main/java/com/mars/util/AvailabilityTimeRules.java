package com.mars.util;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

import com.mars.AvailabilitySlotMessages;
import com.mars.exception.BadRequestException;

public final class AvailabilityTimeRules {

    public static final int APPOINTMENT_DURATION_MINUTES = 10;
    public static final int MINUTE_STEP = 10;
    /** RecurrenceRule.repeatCount � UX haftalık tekrar için sabit 1. */
    public static final int WEEKLY_REPEAT_COUNT = 1;

    private AvailabilityTimeRules() {
    }

    public static void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null) {
            throw new BadRequestException(AvailabilitySlotMessages.TIME_REQUIRED);
        }
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException(AvailabilitySlotMessages.START_BEFORE_END);
        }
        validateMinuteStep(startTime);
        validateMinuteStep(endTime);
    }

    public static void validateMinuteStep(LocalTime time) {
        if (time.getMinute() % MINUTE_STEP != 0 || time.getSecond() != 0 || time.getNano() != 0) {
            throw new BadRequestException(AvailabilitySlotMessages.INVALID_MINUTE_STEP);
        }
    }

    public static int computeTotalDurationMinutes(LocalTime startTime, LocalTime endTime) {
        return (int) ChronoUnit.MINUTES.between(startTime, endTime);
    }

    public static int computeAppointmentSlotCount(LocalTime startTime, LocalTime endTime) {
        int total = computeTotalDurationMinutes(startTime, endTime);
        return total / APPOINTMENT_DURATION_MINUTES;
    }

    public static int computeWeeklyRepeatCount(LocalDate startDate, LocalDate endDate) {
        long weeks = ChronoUnit.WEEKS.between(startDate, endDate);
        return (int) Math.max(1, weeks + 1);
    }
}
