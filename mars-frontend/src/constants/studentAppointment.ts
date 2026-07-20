export const STUDENT_APPOINTMENT_STEPS = [
  { id: 'category', label: 'Kategori' },
  { id: 'course', label: 'Ders' },
  { id: 'slot', label: 'Slot' },
  { id: 'meetingType', label: 'Görüşme Türü' },
  { id: 'confirm', label: 'Onay' },
] as const;

export type StudentAppointmentStepId = (typeof STUDENT_APPOINTMENT_STEPS)[number]['id'];

export const STUDENT_APPOINTMENT_STEP_CATEGORY = 0;
export const STUDENT_APPOINTMENT_STEP_COURSE = 1;

/** Sprint 22.1 uyumluluğu — kategori adımı indeksi. */
export const STUDENT_APPOINTMENT_ACTIVE_STEP_INDEX = STUDENT_APPOINTMENT_STEP_CATEGORY;

export const STUDENT_APPOINTMENT_CATEGORY_GROUP_LABELS: Record<string, string> = {
  ACADEMIC: 'Akademik',
  COURSE_EXAM: 'Ders / Sınav',
  ADMINISTRATIVE: 'İdari',
};

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
  STEP_CATEGORY_TITLE: 'Randevu Kategorisi',
  STEP_CATEGORY_DESCRIPTION: 'Görüşme nedeninize uygun kategoriyi seçin.',
  STEP_CATEGORY_LOADING: 'Kategoriler yükleniyor...',
  STEP_CATEGORY_LOAD_ERROR: 'Kategori listesi yüklenirken bir hata oluştu.',
  STEP_CATEGORY_EMPTY_TITLE: 'Aktif kategori bulunamadı',
  STEP_CATEGORY_EMPTY_DESCRIPTION:
    'Şu an seçilebilir randevu kategorisi bulunmuyor. Lütfen daha sonra tekrar deneyin.',
  STEP_CATEGORY_DURATION: (minutes: number) => `Tahmini süre: ${minutes} dk`,
  CONTINUE: 'Devam Et',
  CONTINUE_DISABLED: 'Devam etmek için bir kategori seçin.',
  BACK_TO_CATEGORY: 'Kategoriye Dön',
  STEP_COURSE_TITLE: 'Ders',
  STEP_COURSE_DESCRIPTION:
    'Ders seçimi bir sonraki adımda açılacaktır. Seçilen kategori bilgisi korundu.',
  STEP_LOCKED: 'Bu adım henüz aktif değil.',
  NO_TITLE: 'Ünvan belirtilmemiş',
  BREADCRUMB_CREATE: 'Randevu Oluştur',
} as const;
