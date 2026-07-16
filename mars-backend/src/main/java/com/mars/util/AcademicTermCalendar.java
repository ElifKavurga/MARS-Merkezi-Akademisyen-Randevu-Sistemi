package com.mars.util;

import java.time.LocalDate;

/**
 * Conventional Turkish academic-term end dates for UX helpers.
 * Does not introduce new persisted entities or SRS fields.
 */
public final class AcademicTermCalendar {

    private AcademicTermCalendar() {
    }

    /**
     * Güz: Sep–Jan → 31 Jan; Bahar: Feb–Jun → 30 Jun; Yaz: Jul–Aug → 31 Aug.
     */
    public static LocalDate resolveCurrentTermEndDate(LocalDate referenceDate) {
        int month = referenceDate.getMonthValue();
        int year = referenceDate.getYear();

        if (month >= 9) {
            return LocalDate.of(year + 1, 1, 31);
        }
        if (month == 1) {
            return LocalDate.of(year, 1, 31);
        }
        if (month <= 6) {
            return LocalDate.of(year, 6, 30);
        }
        return LocalDate.of(year, 8, 31);
    }
}
