export const COURSE_STATUS_FILTER = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ALL: 'ALL',
} as const;

export type CourseSortField = 'courseCode' | 'courseName' | 'academicTerm' | 'isActive';

export const COURSE_SORT_FIELD = {
  COURSE_CODE: 'courseCode',
  COURSE_NAME: 'courseName',
  ACADEMIC_TERM: 'academicTerm',
  STATUS: 'isActive',
} as const;

export const COURSE_MESSAGES = {
  EMPTY_TITLE: 'Henüz tanımlanmış ders bulunmamaktadır.',
  EMPTY_FILTER: 'Seçili filtreye uygun ders bulunamadı.',
  LOAD_ERROR: 'Ders listesi yüklenemedi. Lütfen tekrar deneyin.',
  ACCESS_DENIED: 'Bu sayfaya erişim yetkiniz yok.',
  DETAIL_ERROR: 'Ders detayı yüklenemedi. Lütfen tekrar deneyin.',
  NOT_FOUND: 'Ders bulunamadı.',
  ASSISTANTS_ERROR: 'Asistan listesi yüklenemedi. Lütfen tekrar deneyin.',
  ASSISTANTS_EMPTY: 'Bu derse henüz asistan atanmadı.',
  ASSIGN_SUCCESS: 'Asistan derse başarıyla atandı.',
  ASSIGN_ERROR: 'Asistan atanamadı. Lütfen tekrar deneyin.',
  ASSIGNMENT_UPDATE_SUCCESS: 'Asistan ataması başarıyla güncellendi.',
  ASSIGNMENT_UPDATE_ERROR: 'Asistan ataması güncellenemedi. Lütfen tekrar deneyin.',
  ASSIGNMENT_REMOVE_SUCCESS: 'Asistan ataması başarıyla kaldırıldı.',
  ASSIGNMENT_REMOVE_ERROR: 'Asistan ataması kaldırılamadı. Lütfen tekrar deneyin.',
  ASSIGNMENT_REMOVE_TITLE: 'Asistan Atamasını Kaldır',
  ASSIGNMENT_REMOVE_DESCRIPTION: 'Bu asistanı dersten kaldırmak istediğinize emin misiniz?',
  FORBIDDEN: 'Yetkiniz bulunmamaktadır.',
  ASSIGNMENT_NOT_FOUND: 'Atama bulunamadı.',
  COMING_SOON: 'Bu modül sonraki sprintte geliştirilecektir.',
  SECTION_GENERAL: 'Genel Bilgiler',
  SECTION_ASSISTANTS: 'Asistanlar',
  SECTION_STATS: 'Ders İstatistikleri',
  SECTION_FUTURE: 'Gelecek Modüller',
  SECTION_OFFICE_HOURS: 'Ofis Saatleri',
  SECTION_APPOINTMENTS: 'Randevular',
  SECTION_DELEGATION: 'Randevu Devri Geçmişi',
  STAT_ASSISTANTS: 'Toplam Asistan Sayısı',
  STAT_STATUS: 'Ders Durumu',
  STAT_TERM: 'Akademik Dönem',
  STAT_DEPARTMENT: 'Bölüm',
  BREADCRUMB_ACADEMICIAN: 'Akademisyen',
  BREADCRUMB_COURSES: 'Derslerim',
  PAGE_TITLE_FALLBACK: 'Ders Detayı',
  BACK_TO_COURSES: 'Derslerime Dön',
  CREATE_SUCCESS: 'Ders başarıyla oluşturuldu.',
  UPDATE_SUCCESS: 'Ders başarıyla güncellendi.',
  DEACTIVATE_SUCCESS: 'Ders başarıyla devre dışı bırakıldı.',
  ACTIVATE_SUCCESS: 'Ders başarıyla etkinleştirildi.',
} as const;

export const COURSE_COMING_SOON_MODULES = [
  {
    title: COURSE_MESSAGES.SECTION_OFFICE_HOURS,
    icon: 'schedule',
  },
  {
    title: COURSE_MESSAGES.SECTION_APPOINTMENTS,
    icon: 'event',
  },
  {
    title: COURSE_MESSAGES.SECTION_DELEGATION,
    icon: 'swap_horiz',
  },
] as const;
