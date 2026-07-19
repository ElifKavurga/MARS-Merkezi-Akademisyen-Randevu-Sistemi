package com.mars;

public final class DelegationMessages {

    public static final String APPOINTMENT_REQUIRED = "Randevu seçimi zorunludur.";
    public static final String ASSISTANT_REQUIRED = "Asistan seçimi zorunludur.";
    public static final String ONLY_ACADEMICIAN =
            "Delegasyon yalnızca akademisyenler tarafından başlatılabilir.";
    public static final String ONLY_ASSISTANT =
            "Gelen delegasyonlar yalnızca asistanlar tarafından görüntülenebilir.";
    public static final String APPOINTMENT_NOT_FOUND = "Randevu bulunamadı.";
    public static final String DELEGATION_NOT_FOUND = "Delegasyon kaydı bulunamadı.";
    public static final String ACCESS_DENIED = "Bu delegasyon kaydına erişim yetkiniz yok.";
    public static final String OWNERSHIP_DENIED =
            "Yalnızca kendi randevularınız için delegasyon başlatabilirsiniz.";
    public static final String APPROVED_NOT_ALLOWED =
            "Onaylanmış randevular devredilemez.";
    public static final String TERMINAL_STATUS_NOT_ALLOWED =
            "İptal edilmiş, tamamlanmış veya no-show işaretli randevular devredilemez.";
    public static final String COURSE_REQUIRED =
            "Delegasyon yalnızca ders bağlı randevular için yapılabilir.";
    public static final String ASSISTANT_NOT_FOUND = "Asistan bulunamadı.";
    public static final String ASSISTANT_INACTIVE = "Pasif kullanıcıya delegasyon yapılamaz.";
    public static final String ASSISTANT_ROLE_REQUIRED =
            "Delegasyon yalnızca ASSISTANT rolündeki kullanıcılara yapılabilir.";
    public static final String ASSISTANT_NOT_ASSIGNED =
            "Seçilen asistan, randevuya bağlı derse atanmış olmalıdır.";
    public static final String PENDING_EXISTS =
            "Bu randevu için bekleyen bir delegasyon zaten bulunmaktadır.";
    public static final String DECISION_ACCESS_DENIED =
            "Bu delegasyon üzerinde yalnızca hedef asistan işlem yapabilir.";
    public static final String NOT_PENDING =
            "Yalnızca bekleyen delegasyonlar üzerinde işlem yapılabilir.";
    public static final String APPOINTMENT_NOT_PROCESSABLE =
            "İptal edilmiş, tamamlanmış veya no-show işaretli randevular için "
                    + "delegasyon işlemi yapılamaz.";

    private DelegationMessages() {
    }
}
