export const STUDENT_APPOINTMENT_STEPS = [
  { id: 'category', label: 'Kategori' },
  { id: 'course', label: 'Ders' },
  { id: 'slot', label: 'Slot' },
  { id: 'meetingType', label: 'Görüşme Türü' },
  { id: 'confirm', label: 'Onay' },
] as const;

export type StudentAppointmentStepId = (typeof STUDENT_APPOINTMENT_STEPS)[number]['id'];

/** Sprint 22.1: yalnızca kategori adımı aktif; seçim henüz yok. */
export const STUDENT_APPOINTMENT_ACTIVE_STEP_INDEX = 0;

export const STUDENT_APPOINTMENT_MESSAGES = {
  TITLE: 'Randevu Oluştur',
  SUBTITLE: 'Seçtiğiniz akademisyen için randevu talebini adım adım oluşturun.',
  LOADING: 'Akademisyen bilgileri yükleniyor...',
  LOAD_ERROR: 'Akademisyen bilgileri yüklenirken bir hata oluştu.',
  NOT_FOUND: 'Akademisyen bulunamadı',
  NOT_FOUND_DESCRIPTION:
    'Randevu oluşturmak istediğiniz akademisyen bulunamadı veya listede yer almıyor.',
  INVALID_ID: 'Geçerli bir akademisyen kimliği gereklidir.',
  NOT_ACCEPTING_TITLE: 'Yeni randevu kabul edilmiyor',
  NOT_ACCEPTING_DESCRIPTION:
    'Bu akademisyen şu an yeni randevu kabul etmiyor. Lütfen daha sonra tekrar deneyin.',
  BACK_TO_PROFILE: 'Profile Dön',
  STEP_CATEGORY_TITLE: 'Kategori',
  STEP_CATEGORY_DESCRIPTION:
    'Randevu kategorisi seçimi bir sonraki adımda açılacaktır. Bu ekranda yalnızca akış iskeleti hazırlanmıştır.',
  STEP_LOCKED: 'Bu adım henüz aktif değil.',
  NO_TITLE: 'Ünvan belirtilmemiş',
  BREADCRUMB_CREATE: 'Randevu Oluştur',
} as const;
