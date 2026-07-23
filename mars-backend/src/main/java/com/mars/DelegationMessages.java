package com.mars;

public final class DelegationMessages {

    public static final String APPOINTMENT_REQUIRED = "Randevu seçimi zorunludur.";
    public static final String ASSISTANT_REQUIRED = "Asistan seçimi zorunludur.";
    public static final String TARGET_REQUIRED = "Hedef personel seçimi zorunludur.";
    public static final String TARGET_NOT_FOUND = "Hedef personel bulunamadı.";
    public static final String INVALID_TARGET = "Randevu devri hedefi aktif bir akademisyen veya asistan olmalıdır.";
    public static final String TARGET_SLOT_NOT_FOUND = "Hedef personele ait slot bulunamadı.";
    public static final String TARGET_SLOT_UNAVAILABLE = "Hedef personelin ilgili slotu artık müsait değil.";
    public static final String ONLY_ACADEMICIAN =
            "Randevu devri yalnızca akademisyenler tarafından başlatılabilir.";
    public static final String ONLY_ASSISTANT =
            "Gelen delegasyonlar yalnızca asistanlar tarafından görüntülenebilir.";
    public static final String ONLY_TARGET_STAFF =
            "Gelen randevu devri taleplerini yalnızca hedef akademisyen veya asistan görüntüleyebilir.";
    public static final String ONLY_STUDENT =
            "Randevu devri onayı yalnızca ilgili öğrenci tarafından verilebilir.";
    public static final String HISTORY_ACCESS_DENIED =
            "Randevu devri geçmişi yalnızca akademisyen veya asistan tarafından görüntülenebilir.";
    public static final String APPOINTMENT_NOT_FOUND = "Randevu bulunamadı.";
    public static final String DELEGATION_NOT_FOUND = "Randevu devri kaydı bulunamadı.";
    public static final String INVALID_DELEGATION_ID = "Geçersiz delegasyon kimliği.";
    public static final String ACCESS_DENIED = "Bu delegasyon kaydına erişim yetkiniz yok.";
    public static final String OWNERSHIP_DENIED =
            "Yalnızca kendi randevularınız için delegasyon başlatabilirsiniz.";
    public static final String APPROVED_NOT_ALLOWED =
            "Onaylanmış randevular devredilemez.";
    public static final String TERMINAL_STATUS_NOT_ALLOWED =
            "İptal edilmiş, tamamlanmış veya no-show işaretli randevular devredilemez.";
    public static final String COURSE_REQUIRED =
            "Randevu devri yalnızca ders bağlı randevular için yapılabilir.";
    public static final String ASSISTANT_NOT_FOUND = "Asistan bulunamadı.";
    public static final String ASSISTANT_INACTIVE = "Pasif kullanıcıya delegasyon yapılamaz.";
    public static final String ASSISTANT_ROLE_REQUIRED =
            "Delegasyon yalnızca ASSISTANT rolündeki kullanıcılara yapılabilir.";
    public static final String ASSISTANT_NOT_ASSIGNED =
            "Seçilen asistan, randevuya bağlı derse atanmış olmalıdır.";
    public static final String PENDING_EXISTS =
            "Bu randevu için bekleyen bir randevu devri zaten bulunmaktadır.";
    public static final String DECISION_ACCESS_DENIED =
            "Bu randevu devri üzerinde yalnızca hedef personel işlem yapabilir.";
    public static final String NOT_PENDING =
            "Yalnızca bekleyen randevu devirleri üzerinde işlem yapılabilir.";
    public static final String APPOINTMENT_NOT_PROCESSABLE =
            "Yalnızca bekleyen randevu talepleri için delegasyon işlemi yapılabilir.";
    public static final String STUDENT_DECISION_ACCESS_DENIED =
            "Bu randevu devri üzerinde yalnızca randevu sahibi öğrenci işlem yapabilir.";
    public static final String NOT_PENDING_STUDENT_APPROVAL =
            "Yalnızca öğrenci onayı bekleyen randevu devirleri üzerinde işlem yapılabilir.";
    public static final String STUDENT_APPROVAL_EXPIRED =
            "Randevu devri için iki saatlik öğrenci onay süresi dolmuştur.";
    public static final String INVALID_STATUS_TRANSITION =
            "Randevu devri için geçersiz durum geçişi.";

    private DelegationMessages() {
    }
}
