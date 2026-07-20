package com.mars;

/**
 * Randevu oluşturma kuralları için paylaşılan sabitler.
 */
public final class AppointmentConstraints {

    /**
     * BR-017: Öğrenci, mevcut sistem saatinden itibaren en az bu kadar dakika
     * sonrasındaki uygun slotlara randevu oluşturabilir / görebilir.
     */
    public static final int MINIMUM_BOOKING_NOTICE_MINUTES = 30;

    /**
     * BR-018: Öğrenci bugünden itibaren en fazla bu kadar gün sonrasına
     * randevu oluşturabilir.
     */
    public static final int MAXIMUM_BOOKING_HORIZON_DAYS = 14;

    private AppointmentConstraints() {
    }
}
