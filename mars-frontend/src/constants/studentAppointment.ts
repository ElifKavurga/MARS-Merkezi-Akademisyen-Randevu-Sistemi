import { ROUTES } from './routes';

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
export const STUDENT_APPOINTMENT_STEP_SLOT = 2;
export const STUDENT_APPOINTMENT_STEP_MEETING_TYPE = 3;
export const STUDENT_APPOINTMENT_STEP_CONFIRM = 4;

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
  CONTINUE_COURSE_DISABLED: 'Devam etmek için bir ders seçin.',
  BACK_TO_CATEGORY: 'Kategoriye Dön',
  STEP_COURSE_TITLE: 'Ders Seçimi',
  STEP_COURSE_DESCRIPTION: 'Randevunuzla ilişkili dersi seçin.',
  STEP_COURSE_LOADING: 'Dersler yükleniyor...',
  STEP_COURSE_LOAD_ERROR: 'Ders listesi yüklenirken bir hata oluştu.',
  STEP_COURSE_EMPTY_TITLE: 'Aktif ders bulunamadı',
  STEP_COURSE_EMPTY_DESCRIPTION:
    'Bu akademisyene ait seçilebilir aktif ders bulunmuyor.',
  STEP_COURSE_SKIPPED: 'Atlandı',
  STEP_SLOT_TITLE: 'Slot Seçimi',
  STEP_SLOT_DESCRIPTION: 'Uygun randevu saatlerinden birini seçin.',
  STEP_SLOT_LOADING: 'Uygun randevu saatleri yükleniyor...',
  STEP_SLOT_LOAD_ERROR: 'Uygun randevu saatleri yüklenirken bir hata oluştu.',
  STEP_SLOT_EMPTY_TITLE: 'Uygun randevu saati bulunamadı',
  STEP_SLOT_EMPTY_DESCRIPTION: 'Bu akademisyen için uygun randevu saati bulunamadı.',
  STEP_SLOT_DURATION: (minutes: number) => `${minutes} dk`,
  CONTINUE_SLOT_DISABLED: 'Devam etmek için bir randevu saati seçin.',
  BACK_TO_SLOT: 'Slota Dön',
  STEP_MEETING_TYPE_TITLE: 'Görüşme Türü',
  STEP_MEETING_TYPE_DESCRIPTION: 'Randevu için görüşme türünü onaylayın veya seçin.',
  CONTINUE_MEETING_TYPE_DISABLED: 'Devam etmek için bir görüşme türü seçin.',
  BACK_TO_MEETING_TYPE: 'Görüşme Türüne Dön',
  STEP_CONFIRM_TITLE: 'Onay',
  STEP_CONFIRM_DESCRIPTION: 'Randevu talebinizi göndermeden önce bilgileri kontrol edin.',
  STEP_CONFIRM_ACADEMICIAN: 'Akademisyen',
  STEP_CONFIRM_TITLE_LABEL: 'Akademik Ünvan',
  STEP_CONFIRM_DEPARTMENT: 'Bölüm',
  STEP_CONFIRM_CATEGORY: 'Seçilen Kategori',
  STEP_CONFIRM_COURSE: 'Seçilen Ders',
  STEP_CONFIRM_DATE: 'Tarih',
  STEP_CONFIRM_TIME: 'Saat',
  STEP_CONFIRM_DURATION: 'Süre',
  STEP_CONFIRM_MEETING_TYPE: 'Görüşme Türü',
  STEP_CONFIRM_SUBMIT: 'Randevuyu Onayla',
  STEP_CONFIRM_SUBMITTING: 'Randevu oluşturuluyor...',
  STEP_CONFIRM_DISABLED:
    'Randevuyu onaylamak için kategori, slot ve görüşme türü bilgileri tamamlanmalıdır.',
  STEP_CONFIRM_SUCCESS:
    'Randevu talebiniz başarıyla oluşturuldu. Randevularım sayfasına yönlendiriliyorsunuz.',
  STEP_CONFIRM_ERROR: 'Randevu talebi oluşturulamadı. Lütfen tekrar deneyin.',
  BACK_TO_COURSE: 'Derse Dön',
  STEP_LOCKED: 'Bu adım henüz aktif değil.',
  STEP_STATUS_CURRENT: 'mevcut adım',
  STEP_STATUS_COMPLETED: 'tamamlandı',
  STEP_STATUS_SKIPPED: 'atlandı',
  STEP_STATUS_LOCKED: 'kilitli',
  NO_TITLE: 'Ünvan belirtilmemiş',
  BREADCRUMB_CREATE: 'Randevu Oluştur',
  MY_APPOINTMENTS_TITLE: 'Randevularım',
  MY_APPOINTMENTS_SUBTITLE: 'Aktif randevu taleplerinizi buradan takip edebilirsiniz.',
  MY_APPOINTMENTS_LOADING: 'Randevular yükleniyor...',
  MY_APPOINTMENTS_LOAD_ERROR: 'Randevular yüklenirken bir hata oluştu.',
  MY_APPOINTMENTS_EMPTY_TITLE: 'Aktif randevunuz yok',
  MY_APPOINTMENTS_EMPTY_DESCRIPTION:
    'Henüz bekleyen veya onaylanmış bir randevunuz bulunmuyor.',
  TAB_ACTIVE: 'Aktif Randevular',
  TAB_PAST: 'Geçmiş Randevular',
  PAST_LOADING: 'Geçmiş randevular yükleniyor...',
  PAST_LOAD_ERROR: 'Geçmiş randevular yüklenirken bir hata oluştu.',
  PAST_EMPTY_TITLE: 'Geçmiş randevu yok',
  PAST_EMPTY_DESCRIPTION:
    'Tamamlanan, iptal edilen veya reddedilen randevularınız burada listelenir.',
  MY_APPOINTMENTS_ACADEMICIAN: 'Akademisyen',
  MY_APPOINTMENTS_TITLE_LABEL: 'Akademik Ünvan',
  MY_APPOINTMENTS_DEPARTMENT: 'Bölüm',
  MY_APPOINTMENTS_DATE: 'Tarih',
  MY_APPOINTMENTS_TIME: 'Saat',
  MY_APPOINTMENTS_CATEGORY: 'Kategori',
  MY_APPOINTMENTS_COURSE: 'Ders',
  MY_APPOINTMENTS_MEETING_TYPE: 'Görüşme Türü',
  MY_APPOINTMENTS_NO_TITLE: 'Ünvan belirtilmemiş',
  MY_APPOINTMENTS_NO_COURSE: '—',
  DETAIL_TITLE: 'Randevu Detayı',
  DETAIL_SUBTITLE: 'Seçtiğiniz randevunun bilgilerini inceleyin.',
  DETAIL_LOADING: 'Randevu detayı yükleniyor...',
  DETAIL_LOAD_ERROR: 'Randevu detayı yüklenirken bir hata oluştu.',
  DETAIL_NOT_FOUND: 'Randevu bulunamadı.',
  DETAIL_ACCESS_DENIED: 'Bu randevuyu görüntüleme yetkiniz yok.',
  DETAIL_INVALID_ID: 'Geçerli bir randevu kimliği gereklidir.',
  DETAIL_BACK: 'Randevularıma Dön',
  DETAIL_SECTION_ACADEMICIAN: 'Akademisyen Bilgileri',
  DETAIL_SECTION_APPOINTMENT: 'Randevu Bilgileri',
  DETAIL_SECTION_LOCATION: 'Konum Bilgisi',
  DETAIL_FULL_NAME: 'Ad Soyad',
  DETAIL_ACADEMIC_TITLE: 'Akademik Ünvan',
  DETAIL_DEPARTMENT: 'Bölüm',
  DETAIL_DATE: 'Tarih',
  DETAIL_START_TIME: 'Başlangıç Saati',
  DETAIL_END_TIME: 'Bitiş Saati',
  DETAIL_STATUS: 'Durum',
  DETAIL_CATEGORY: 'Kategori',
  DETAIL_COURSE: 'Ders',
  DETAIL_MEETING_TYPE: 'Görüşme Türü',
  DETAIL_OFFICE: 'Ofis',
  DETAIL_BUILDING: 'Bina',
  DETAIL_ONLINE_INFO:
    'Bu randevu online olarak planlanmıştır. Görüşme bağlantısı henüz paylaşılmamıştır.',
  DETAIL_LOCATION_EMPTY: 'Konum bilgisi henüz tanımlanmamış.',
  VIEW_DETAIL: 'Detay',
  CANCEL_ACTION: 'İptal Et',
  CANCEL_TITLE: 'Randevuyu İptal Et',
  CANCEL_DESCRIPTION:
    'Bu randevuyu iptal etmek istediğinize emin misiniz? İptal edilen randevu aktif listeden kaldırılır.',
  CANCEL_CONFIRM: 'Randevuyu İptal Et',
  CANCEL_DISMISS: 'Vazgeç',
  CANCEL_SUCCESS: 'Randevu başarıyla iptal edildi.',
  CANCEL_ERROR: 'Randevu iptal edilemedi. Lütfen tekrar deneyin.',
} as const;

/**
 * Randevu oluşturma sonrası yönlendirme.
 * Sprint 23’te Randevularım içeriği doldurulduğunda bu sabit aynı kalır.
 */
export const STUDENT_POST_APPOINTMENT_REDIRECT = ROUTES.STUDENT_APPOINTMENTS;
