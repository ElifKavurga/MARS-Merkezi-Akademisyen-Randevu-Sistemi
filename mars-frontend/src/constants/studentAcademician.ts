export const STUDENT_ACADEMICIAN_MESSAGES = {
  TITLE: 'Akademisyen Ara',
  SUBTITLE:
    'Sistemde kayıtlı akademisyenleri ad, soyad veya bölüme göre arayın; ünvan ve randevu kabul durumuna göre filtreleyin.',
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
  EMPTY_TITLE: 'Akademisyen bulunamadı',
  EMPTY_DESCRIPTION: 'Arama kriterlerinize uygun akademisyen bulunmuyor.',
  LOAD_ERROR: 'Akademisyen listesi yüklenirken bir hata oluştu.',
  ACCESS_DENIED: 'Bu sayfaya erişim yetkiniz yok.',
  LOADING: 'Akademisyenler yükleniyor...',
  VIEW_PROFILE: 'Profili Gör',
  NO_TITLE: 'Ünvan belirtilmemiş',
  PREVIOUS_PAGE: 'Önceki',
  NEXT_PAGE: 'Sonraki',
  PAGE_OF: (page: number, totalPages: number) =>
    `Sayfa ${page} / ${Math.max(totalPages, 1)}`,
  PROFILE_LOADING: 'Akademisyen profili yükleniyor...',
  PROFILE_NOT_FOUND: 'Akademisyen bulunamadı',
  PROFILE_NOT_FOUND_DESCRIPTION:
    'Aradığınız akademisyen bulunamadı veya artık listede yer almıyor.',
  PROFILE_LOAD_ERROR: 'Akademisyen profili yüklenirken bir hata oluştu.',
  BACK_TO_SEARCH: 'Aramaya Dön',
  COURSES_TITLE: 'Verilen Dersler',
  COURSES_EMPTY: 'Bu akademisyene ait aktif ders bulunmuyor.',
  OFFICE_TITLE: 'Ofis Bilgileri',
  OFFICE_NAME: 'Ofis Adı',
  OFFICE_LOCATION: 'Ofis Konumu',
  OFFICE_EMPTY: 'Ofis bilgisi henüz tanımlanmamış.',
  ABOUT_TITLE: 'Hakkında',
  ABOUT_EMPTY: 'Hakkında bilgisi henüz eklenmemiş.',
  BOOK_APPOINTMENT: 'Randevu Al',
  BOOK_APPOINTMENT_DISABLED: 'Bu akademisyen şu an yeni randevu kabul etmiyor.',
} as const;

/** Sprint 22 randevu oluşturma: minimum rezervasyon süresi (dakika). */
export const MINIMUM_BOOKING_NOTICE_MINUTES = 30;

/** Sprint 29 bildirim sistemi için hazır metin. */
export const NOTIFICATION_EVENT_MESSAGES = {
  NEW_APPOINTMENT_REQUEST: 'Yeni randevu talebi oluşturuldu.',
} as const;

export const STUDENT_ACADEMICIAN_PAGE_SIZE = 12;
