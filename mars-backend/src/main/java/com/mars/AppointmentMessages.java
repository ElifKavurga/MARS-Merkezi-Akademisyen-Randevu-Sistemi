package com.mars;

public final class AppointmentMessages {

    public static final String SLOT_REQUIRED = "Ofis saati seçimi zorunludur.";
    public static final String CATEGORY_REQUIRED = "Randevu kategorisi zorunludur.";
    public static final String SLOT_NOT_FOUND = "Ofis saati bulunamadı.";
    public static final String CATEGORY_NOT_FOUND = "Randevu kategorisi bulunamadı.";
    public static final String COURSE_REQUIRED = "Bu kategori için ders seçimi zorunludur.";
    public static final String COURSE_NOT_ALLOWED = "Bu kategori için ders se�ilemez.";
    public static final String COURSE_NOT_FOUND = "Ders bulunamadı.";
    public static final String COURSE_STAFF_MISMATCH =
            "Se�ilen ders, ofis saatine ait akademisyene ait olmalıdır.";
    public static final String SLOT_BLOCKED = "Engellenmiş ofis saati için randevu talebi oluşturulamaz.";
    public static final String SLOT_PAST = "Ge�miş ofis saati için randevu talebi oluşturulamaz.";
    public static final String SLOT_TOO_SOON =
            "Randevu, sistem saatinden en az 30 dakika sonrasına oluşturulabilir.";
    public static final String SLOT_TOO_FAR =
            "Randevu, bugünden itibaren en fazla 14 gün sonrasına oluşturulabilir.";
    public static final String SLOT_OUT_OF_OFFICE =
            "Akademisyenin ofis dışı olduğu dönemde randevu oluşturulamaz.";
    public static final String STAFF_INACTIVE =
            "Pasif akademisyenden randevu alınamaz.";
    public static final String STAFF_NOT_ACCEPTING =
            "Bu akademisyen şu an yeni randevu kabul etmiyor.";
    public static final String STAFF_NOT_BOOKABLE =
            "Se�ilen ofis saati randevu alınabilir bir akademisyene ait olmalıdır.";
    public static final String SLOT_TAKEN = "Bu ofis saati başka bir Öğrenci tarafından alınmıştır.";
    public static final String STUDENT_RESTRICTED =
            "Aktif cezanız bulunduğu için yeni randevu talebi oluşturamazsınız.";
    public static final String TIME_OVERLAP =
            "Aynı saat aralığında başka bir randevu talebiniz bulunmaktadır.";
    public static final String COURSE_INACTIVE = "Se�ilen ders aktif değil.";
    public static final String MEETING_TYPE_REQUIRED = "G�r�şme tipi seçimi zorunludur.";
    public static final String INVALID_MEETING_TYPE = "Ge�ersiz gör�şme tipi.";
    public static final String MEETING_TYPE_NOT_ALLOWED =
            "Se�ilen gör�şme tipi bu ofis saati için uygun değildir.";
    public static final String ONLY_STUDENT = "Randevu talebi yalnızca Öğrenciler tarafından oluşturulabilir.";
    public static final String ONLY_ASSISTANT =
            "Bu randevu bilgileri yalnızca asistanlar tarafından görüntülenebilir.";
    public static final String ONLY_ACADEMICIAN =
            "Bu randevu bilgileri yalnızca akademisyenler tarafından görüntülenebilir.";
    public static final String APPOINTMENT_NOT_FOUND = "Randevu bulunamadı.";
    public static final String STUDENT_APPOINTMENT_ACCESS_DENIED =
            "Bu randevuyu görüntüleme yetkiniz yok.";
    public static final String CANCEL_ACCESS_DENIED =
            "Bu randevuyu iptal etme yetkiniz yok.";
    public static final String CANCEL_NOT_ACTIVE =
            "Yalnızca bekleyen veya onaylanmış randevular iptal edilebilir.";
    public static final String CANCEL_ALREADY_CANCELLED = "Randevu zaten iptal edilmiş.";
    public static final String CANCEL_PAST =
            "Ge�miş tarihli randevular iptal edilemez.";
    public static final String INVALID_STATUS = "Ge�ersiz randevu durumu.";
    public static final String ALREADY_APPROVED = "Randevu zaten onaylanmış.";
    public static final String ALREADY_REJECTED = "Randevu zaten reddedilmiş.";
    public static final String NOT_PENDING =
            "Yalnızca bekleyen randevu talepleri üzerinde işlem yapılabilir.";
    public static final String RESCHEDULE_NOT_ALLOWED =
            "Tamamlanmış, iptal edilmiş veya No-Show randevular yeniden planlanamaz.";

    public static final String RESCHEDULE_ALREADY_PENDING = "Bu randevu için bekleyen bir yeniden planlama talebi bulunuyor.";
    public static final String RESCHEDULE_REQUEST_NOT_FOUND = "Yeniden planlama talebi bulunamadı.";
    public static final String RESCHEDULE_REQUEST_EXPIRED = "Yeniden planlama talebinin süresi doldu.";

    private AppointmentMessages() {
    }
}
