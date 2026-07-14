/** Geçici sabit listeler — sonraki sprintte backend'den gelecek. */
export const ADMIN_ROLE_OPTIONS = [
  { id: 1, label: 'Öğrenci' },
  { id: 2, label: 'Asistan' },
  { id: 3, label: 'Akademisyen' },
  { id: 4, label: 'Bölüm Başkanı' },
  { id: 5, label: 'Yönetici' },
] as const;

export const ADMIN_DEPARTMENT_OPTIONS = [
  { id: 6, label: 'Bilgisayar Mühendisliği' },
  { id: 7, label: 'Yazılım Mühendisliği' },
  { id: 8, label: 'Elektrik Elektronik Mühendisliği' },
  { id: 9, label: 'Makine Mühendisliği' },
] as const;
