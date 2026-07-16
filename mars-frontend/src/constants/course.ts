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
  ASSISTANTS_ERROR: 'Asistan listesi yüklenemedi. Lütfen tekrar deneyin.',
  ASSISTANTS_EMPTY: 'Bu derse henüz asistan atanmadı.',
  ASSIGN_SUCCESS: 'Asistan derse başarıyla atandı.',
  ASSIGN_ERROR: 'Asistan atanamadı. Lütfen tekrar deneyin.',
  ASSIGNMENT_UPDATE_SUCCESS: 'Asistan ataması başarıyla güncellendi.',
  ASSIGNMENT_UPDATE_ERROR: 'Asistan ataması güncellenemedi. Lütfen tekrar deneyin.',
  ASSIGNMENT_REMOVE_SUCCESS: 'Asistan ataması başarıyla kaldırıldı.',
  ASSIGNMENT_REMOVE_ERROR: 'Asistan ataması kaldırılamadı. Lütfen tekrar deneyin.',
  CREATE_SUCCESS: 'Ders başarıyla oluşturuldu.',
  UPDATE_SUCCESS: 'Ders başarıyla güncellendi.',
  DEACTIVATE_SUCCESS: 'Ders başarıyla pasifleştirildi.',
  ACTIVATE_SUCCESS: 'Ders başarıyla aktifleştirildi.',
} as const;
