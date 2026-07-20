package com.mars;

/**
 * Randevu oluşturma kuralları için paylaşılan sabitler.
 * Minimum rezervasyon süresi (BR-017) Sprint 21.5'ten itibaren uygun slot listelemede uygulanır;
 * Sprint 22'de randevu oluşturma sırasında da doğrulanmalıdır.
 */
public final class AppointmentConstraints {

    /**
     * Öğrenci, mevcut sistem saatinden itibaren en az bu kadar dakika sonrasındaki
     * uygun slotlara randevu oluşturabilir / görebilir.
     */
    public static final int MINIMUM_BOOKING_NOTICE_MINUTES = 30;

    private AppointmentConstraints() {
    }
}
