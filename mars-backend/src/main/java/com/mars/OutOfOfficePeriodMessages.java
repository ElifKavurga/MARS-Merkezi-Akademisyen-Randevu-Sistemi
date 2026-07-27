package com.mars;

public final class OutOfOfficePeriodMessages {

    public static final String START_DATE_REQUIRED = "Başlangıç tarihi zorunludur.";
    public static final String END_DATE_REQUIRED = "Bitiş tarihi zorunludur.";
    public static final String REASON_CODE_REQUIRED = "Sebep zorunludur.";
    public static final String INVALID_REASON_CODE = "Ge�ersiz ofis dışı sebep kodu.";
    public static final String INVALID_DATE_RANGE = "Başlangıç tarihi bitiş tarihinden sonra olamaz.";
    public static final String PAST_DATE = "Ge�miş tarih için ofis dışı dönem oluşturulamaz.";
    public static final String OVERLAP = "Bu tarih aralığında çakışan bir ofis dışı dönem bulunmaktadır.";
    public static final String ACTIVE_APPOINTMENTS =
            "Bu tarih aralığındaki ofis saatlerinde bekleyen veya onaylı randevu bulunduğu için "
                    + "ofis dışı dönem oluşturulamaz. Randevular sessizce iptal edilmez.";
    public static final String PERIOD_NOT_FOUND = "Ofis dışı dönem bulunamadı.";
    public static final String ACCESS_DENIED = "Bu ofis dışı dönemi güncelleme yetkiniz yok.";
    public static final String PAST_PERIOD_NOT_UPDATABLE =
            "Ge�mişte tamamen bitmiş ofis dışı dönemler güncellenemez.";
    public static final String ACTIVE_APPOINTMENTS_UPDATE =
            "Bu tarih aralığındaki ofis saatlerinde bekleyen veya onaylı randevu bulunduğu için "
                    + "ofis dışı dönem güncellenemez. Randevular sessizce iptal edilmez.";
    public static final String END_ACCESS_DENIED = "Bu ofis dışı dönemi sonlandırma yetkiniz yok.";
    public static final String PAST_PERIOD_NOT_ENDABLE =
            "Ge�mişte tamamen bitmiş ofis dışı dönemler için işlem yapılamaz.";
    public static final String ALREADY_ENDED = "Bu ofis dışı dönem daha önce sonlandırılmıştır.";

    private OutOfOfficePeriodMessages() {
    }
}
