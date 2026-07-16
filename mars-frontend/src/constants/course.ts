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
  CREATE_SUCCESS: 'Ders başarıyla oluşturuldu.',
  UPDATE_SUCCESS: 'Ders başarıyla güncellendi.',
  DEACTIVATE_SUCCESS: 'Ders başarıyla pasifleştirildi.',
  ACTIVATE_SUCCESS: 'Ders başarıyla aktifleştirildi.',
} as const;
