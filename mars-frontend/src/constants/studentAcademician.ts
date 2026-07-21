export const STUDENT_ACADEMICIAN_MESSAGES = {
  TITLE: 'Randevu Al',
  SUBTITLE:
    'Sistemde kayıtlı akademisyen ve asistanları ad, soyad veya bölüme göre arayın; ünvan ve randevu kabul durumuna göre filtreleyin.',
  SEARCH_PLACEHOLDER: 'Ad, soyad veya bölüm ara...',
  DEPARTMENT_ALL: 'Tüm Bölümler',
  TITLE_ALL: 'Tüm Ünvanlar',
  ACCEPTING_ALL: 'Tüm Durumlar',
  ACCEPTING_ACTIVE: 'Randevu kabul ediyor',
  ACCEPTING_INACTIVE: 'Randevu kabul etmiyor',
  STATUS_ACTIVE: 'Aktif',
  STATUS_INACTIVE: 'Pasif',
  STATUS_ACCEPTING: 'Randevu Kabul Ediyor',
  STATUS_NOT_ACCEPTING: 'Yeni Randevu Kabul Etmiyor',
  SORT_LABEL: 'Sırala',
  SORT_NAME_ASC: "Ada göre (A-Z)",
  SORT_NAME_DESC: "Ada göre (Z-A)",
  FILTER: 'Filtrele',
  RESULTS: 'Sonuçlar',
  EMPTY_TITLE: 'Personel bulunamadı',
  EMPTY_DESCRIPTION: 'Arama kriterlerinize uygun personel bulunmuyor.',
  LOAD_ERROR: 'Personel listesi yüklenirken bir hata oluştu.',
  ACCESS_DENIED: 'Bu sayfaya erişim yetkiniz yok.',
  LOADING: 'Personel listesi yükleniyor...',
  VIEW_PROFILE: 'Profili Gör',
  NO_TITLE: 'Ünvan belirtilmemiş',
  PREVIOUS_PAGE: 'Önceki',
  NEXT_PAGE: 'Sonraki',
  PAGE_OF: (page: number, totalPages: number) =>
    `Sayfa ${page} / ${Math.max(totalPages, 1)}`,
  PROFILE_LOADING: 'Profil yükleniyor...',
  PROFILE_NOT_FOUND: 'Personel bulunamadı',
  PROFILE_NOT_FOUND_DESCRIPTION:
    'Aradığınız personel bulunamadı veya artık listede yer almıyor.',
  PROFILE_LOAD_ERROR: 'Profil yüklenirken bir hata oluştu.',
  BACK_TO_SEARCH: 'Aramaya Dön',
  COURSES_TITLE: 'Verilen Dersler',
  COURSES_EMPTY: 'Bu personele ait aktif ders bulunmuyor.',
  OFFICE_TITLE: 'Ofis Bilgileri',
  OFFICE_NAME: 'Ofis Adı',
  OFFICE_LOCATION: 'Ofis Konumu',
  OFFICE_EMPTY: 'Ofis bilgisi henüz tanımlanmamış.',
  ABOUT_TITLE: 'Hakkında',
  ABOUT_EMPTY: 'Hakkında bilgisi henüz eklenmemiş.',
  BOOK_APPOINTMENT: 'Randevu Al',
  BOOK_APPOINTMENT_DISABLED: 'Bu personel şu an yeni randevu kabul etmiyor.',
  TITLES_LOAD_ERROR: 'Akademik ünvan listesi yüklenemedi. Diğer filtrelerle aramaya devam edebilirsiniz.',
  SEARCH_LABEL: 'Ad, soyad veya bölüm ara',
  DEPARTMENT_FILTER_LABEL: 'Bölüm filtresi',
  TITLE_FILTER_LABEL: 'Akademik ünvan filtresi',
  ACCEPTING_FILTER_LABEL: 'Randevu kabul durumu filtresi',
  DEPARTMENT_FIELD: 'Bölüm',
  EMAIL_FIELD: 'E-posta',
  AVAILABILITY_TITLE: 'Uygun Randevu Saatleri',
  AVAILABILITY_EMPTY_TITLE: 'Uygun randevu bulunamadı',
  AVAILABILITY_EMPTY: 'Bu personel için uygun randevu bulunamadı.',
  AVAILABILITY_LOADING: 'Uygun randevu saatleri yükleniyor...',
  AVAILABILITY_LOAD_ERROR: 'Uygun randevu saatleri yüklenirken bir hata oluştu.',
  AVAILABILITY_DATE: 'Tarih',
  AVAILABILITY_START: 'Başlangıç',
  AVAILABILITY_END: 'Bitiş',
  AVAILABILITY_MEETING_TYPE: 'Görüşme Türü',
} as const;

/** Sprint 21.5+ BR-017: minimum rezervasyon süresi (dakika). */
export const MINIMUM_BOOKING_NOTICE_MINUTES = 30;

/** Sprint 22.7 BR-018: maksimum rezervasyon penceresi (gün). */
export const MAXIMUM_BOOKING_HORIZON_DAYS = 14;

/** Sprint 29 bildirim sistemi için hazır metin. */
export const NOTIFICATION_EVENT_MESSAGES = {
  NEW_APPOINTMENT_REQUEST: 'Yeni randevu talebi oluşturuldu.',
} as const;

export const STUDENT_ACADEMICIAN_PAGE_SIZE = 12;
