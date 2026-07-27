package com.mars;

public final class RecurrenceRuleMessages {

    public static final String SLOT_NOT_FOUND = "Ofis saati bulunamadı.";
    public static final String RULE_NOT_FOUND = "Tekrar kuralı bulunamadı.";
    public static final String ACCESS_DENIED = "Bu ofis saati için tekrar kuralı oluşturma yetkiniz yok.";
    public static final String UPDATE_ACCESS_DENIED = "Bu tekrar kuralını güncelleme yetkiniz yok.";
    public static final String ALREADY_EXISTS = "Bu ofis saati için zaten bir tekrar kuralı tanımlanmıştır.";
    public static final String INVALID_REPEAT_TYPE = "Ge�ersiz tekrar tür�.";
    public static final String ONLY_WEEKLY_SUPPORTED = "Sistem yalnızca haftalık (WEEKLY) tekrar tipini desteklemektedir.";
    public static final String REPEAT_TYPE_IMMUTABLE = "Tekrar tipi değiştirilemez.";
    public static final String START_DATE_REQUIRED = "Tekrar başlangıç tarihi boş olamaz.";
    public static final String END_DATE_REQUIRED = "Tekrar bitiş tarihi boş olamaz.";
    public static final String INVALID_DATE_RANGE = "Bitiş tarihi başlangıç tarihinden önce olamaz.";
    public static final String INVALID_REPEAT_COUNT = "Tekrar sayısı pozitif olmalıdır.";
    public static final String PAST_RULE_NOT_UPDATABLE = "Ge�mişte tamamlanmış tekrarlar güncellenemez.";
    public static final String ONLY_FUTURE_UPDATABLE = "Güncelleme yalnızca gelecek tarihli tekrarlar için yapılabilir.";
    public static final String END_ACCESS_DENIED = "Bu tekrar kuralını sonlandırma yetkiniz yok.";
    public static final String PAST_RULE_NOT_ENDABLE = "Ge�mişte tamamlanmış tekrarlar için işlem yapılamaz.";
    public static final String ALREADY_ENDED = "Bu tekrar kuralı daha önce sonlandırılmıştır.";

    private RecurrenceRuleMessages() {
    }
}
