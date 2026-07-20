package com.mars;

/**
 * Randevu oluşturma kuralları için paylaşılan sabitler.
 * Sprint 22'de minimum rezervasyon süresi doğrulaması bu sabiti kullanmalıdır.
 */
public final class AppointmentConstraints {

    /**
     * Öğrenci, mevcut sistem saatinden itibaren en az bu kadar dakika sonrasındaki
     * uygun slotlara randevu oluşturabilir.
     */
    public static final int MINIMUM_BOOKING_NOTICE_MINUTES = 30;

    private AppointmentConstraints() {
    }
}
