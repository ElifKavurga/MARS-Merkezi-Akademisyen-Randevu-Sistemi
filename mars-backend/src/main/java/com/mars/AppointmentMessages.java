package com.mars;

public final class AppointmentMessages {

    public static final String SLOT_REQUIRED = "Ofis saati seçimi zorunludur.";
    public static final String CATEGORY_REQUIRED = "Randevu kategorisi zorunludur.";
    public static final String SLOT_NOT_FOUND = "Ofis saati bulunamadı.";
    public static final String CATEGORY_NOT_FOUND = "Randevu kategorisi bulunamadı.";
    public static final String COURSE_REQUIRED = "Bu kategori için ders seçimi zorunludur.";
    public static final String COURSE_NOT_ALLOWED = "Bu kategori için ders seçilemez.";
    public static final String COURSE_NOT_FOUND = "Ders bulunamadı.";
    public static final String COURSE_STAFF_MISMATCH =
            "Seçilen ders, ofis saatine ait akademisyene ait olmalıdır.";
    public static final String SLOT_BLOCKED = "Engellenmiş ofis saati için randevu talebi oluşturulamaz.";
    public static final String SLOT_PAST = "Geçmiş ofis saati için randevu talebi oluşturulamaz.";
    public static final String SLOT_TAKEN = "Bu ofis saati başka bir öğrenci tarafından alınmıştır.";
    public static final String STUDENT_RESTRICTED =
            "Aktif cezanız bulunduğu için yeni randevu talebi oluşturamazsınız.";
    public static final String TIME_OVERLAP =
            "Aynı saat aralığında başka bir randevu talebiniz bulunmaktadır.";
    public static final String MEETING_TYPE_REQUIRED = "Görüşme tipi seçimi zorunludur.";
    public static final String INVALID_MEETING_TYPE = "Geçersiz görüşme tipi.";
    public static final String MEETING_TYPE_NOT_ALLOWED =
            "Seçilen görüşme tipi bu ofis saati için uygun değildir.";
    public static final String ONLY_STUDENT = "Randevu talebi yalnızca öğrenciler tarafından oluşturulabilir.";
    public static final String ONLY_ASSISTANT =
            "Bu randevu bilgileri yalnızca asistanlar tarafından görüntülenebilir.";
    public static final String APPOINTMENT_NOT_FOUND = "Randevu bulunamadı.";
    public static final String INVALID_STATUS = "Geçersiz randevu durumu.";

    private AppointmentMessages() {
    }
}
