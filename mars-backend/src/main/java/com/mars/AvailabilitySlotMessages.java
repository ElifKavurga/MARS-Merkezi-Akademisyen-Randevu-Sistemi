package com.mars;

public final class AvailabilitySlotMessages {

    public static final String SLOT_NOT_FOUND = "Ofis saati bulunamadı.";
    public static final String OVERLAP = "Bu tarih ve saat aralığında çakışan bir ofis saati bulunmaktadır.";
    public static final String START_BEFORE_END = "Başlangıç saati bitiş saatinden önce olmalıdır.";
    public static final String PAST_DATE_CREATE = "Geçmiş tarih için ofis saati oluşturulamaz.";
    public static final String PAST_DATE_UPDATE = "Geçmiş tarih için ofis saati güncellenemez.";
    public static final String BLOCKED_NOT_EDITABLE = "Pasif ofis saati güncellenemez.";
    public static final String UPDATE_DENIED = "Bu ofis saatini güncelleme yetkiniz yok.";
    public static final String BLOCK_DENIED = "Bu ofis saatinin durumunu değiştirme yetkiniz yok.";
    public static final String UPDATE_ACTIVE_APPOINTMENTS =
            "Bu ofis saatine ait aktif randevular bulunduğu için güncelleme yapılamaz.";
    public static final String BLOCK_ACTIVE_APPOINTMENTS =
            "Bu ofis saatine ait aktif randevular bulunduğu için slot engellenemez.";
    public static final String ALREADY_BLOCKED = "Bu ofis saati zaten engelli.";
    public static final String ALREADY_AVAILABLE = "Bu ofis saati zaten uygun durumda.";

    private AvailabilitySlotMessages() {
    }
}
