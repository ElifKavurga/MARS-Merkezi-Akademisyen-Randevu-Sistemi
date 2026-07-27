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
     * G�z: Sep�Jan → 31 Jan; Bahar: Feb�Jun → 30 Jun; Yaz: Jul�Aug → 31 Aug.
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

    /**
     * Öğrenci bookable-slot listesi için �st sınır: mevcut dönem sonu + bir sonraki dönem sonu.
     * Yaz döneminde OOO sonrası gelen haftalık occurrence'lar 31 Ağustos'ta kesilmez.
     */
    public static LocalDate resolveBookableHorizonEnd(LocalDate referenceDate) {
        LocalDate currentTermEnd = resolveCurrentTermEndDate(referenceDate);
        return resolveCurrentTermEndDate(currentTermEnd.plusDays(1));
    }
}
