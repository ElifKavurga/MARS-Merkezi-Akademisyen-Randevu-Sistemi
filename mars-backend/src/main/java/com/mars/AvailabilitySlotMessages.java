package com.mars;

public final class AvailabilitySlotMessages {

    public static final String SLOT_NOT_FOUND = "Ofis saati bulunamadı.";
    public static final String OVERLAP = "Bu tarih ve saat aralığında çakışan bir ofis saati bulunmaktadır.";
    public static final String START_BEFORE_END = "Başlangıç saati bitiş saatinden önce olmalıdır.";
    public static final String TIME_REQUIRED = "Başlangıç ve bitiş saati zorunludur.";
    public static final String INVALID_MINUTE_STEP =
            "Saat seçimleri yalnızca 10 dakikalık aralıklarla yapılabilir (00, 10, 20, 30, 40, 50).";
    public static final String DAYS_REQUIRED = "En az bir gün seçilmelidir.";
    public static final String INVALID_DAY = "Yalnızca Pazartesi�Cuma günleri seçilebilir.";
    public static final String SLOT_TYPE_REQUIRED = "Ofis saati türü zorunludur.";
    public static final String SLOT_DATE_REQUIRED = "Tarih zorunludur.";
    public static final String RECURRENCE_END_MODE_REQUIRED = "Tekrar süresi seçimi zorunludur.";
    public static final String RECURRENCE_END_DATE_REQUIRED = "Bitiş tarihi zorunludur.";
    public static final String RECURRENCE_END_BEFORE_START =
            "Tekrar bitiş tarihi, ofis saati başlangıç tarihinden önce olamaz.";
    public static final String PAST_DATE_CREATE = "Ge�miş tarih için ofis saati oluşturulamaz.";
    public static final String PAST_DATE_UPDATE = "Ge�miş tarih için ofis saati güncellenemez.";
    public static final String BLOCKED_NOT_EDITABLE = "Pasif ofis saati güncellenemez.";
    public static final String UPDATE_DENIED = "Bu ofis saatini güncelleme yetkiniz yok.";
    public static final String BLOCK_DENIED = "Bu ofis saatinin durumunu değiştirme yetkiniz yok.";
    public static final String UPDATE_ACTIVE_APPOINTMENTS =
            "Bu ofis saatine ait aktif randevular bulunduğu için güncelleme yapılamaz.";
    public static final String BLOCK_ACTIVE_APPOINTMENTS =
            "Bu ofis saatine ait aktif randevular bulunduğu için slot engellenemez.";
    public static final String ALREADY_BLOCKED = "Bu ofis saati zaten engelli.";
    public static final String ALREADY_AVAILABLE = "Bu ofis saati zaten uygun durumda.";
    public static final String MEETING_TYPE_REQUIRED = "G�r�şme tipi zorunludur.";
    public static final String INVALID_MEETING_TYPE = "Ge�ersiz gör�şme tipi.";

    private AvailabilitySlotMessages() {
    }
}
