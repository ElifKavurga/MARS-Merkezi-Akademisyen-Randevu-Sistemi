/** Geçici sabit listeler — sonraki sprintte backend'den gelecek. */
export const ADMIN_ROLE_OPTIONS = [
  { id: 1, name: 'STUDENT', label: 'Öğrenci' },
  { id: 2, name: 'ASSISTANT', label: 'Asistan' },
  { id: 3, name: 'ACADEMICIAN', label: 'Akademisyen' },
  { id: 4, name: 'HOD', label: 'Bölüm Başkanı' },
  { id: 5, name: 'ADMIN', label: 'Yönetici' },
] as const;

export const ADMIN_DEPARTMENT_OPTIONS = [
  { id: 6, label: 'Bilgisayar Mühendisliği' },
  { id: 7, label: 'Yazılım Mühendisliği' },
  { id: 8, label: 'Elektrik Elektronik Mühendisliği' },
  { id: 9, label: 'Makine Mühendisliği' },
] as const;

export function resolveRoleIdByName(roleName: string): number {
  const match = ADMIN_ROLE_OPTIONS.find((role) => role.name === roleName);
  return match?.id ?? ADMIN_ROLE_OPTIONS[0].id;
}

export function resolveDepartmentIdByName(departmentName: string): number {
  const match = ADMIN_DEPARTMENT_OPTIONS.find((department) => department.label === departmentName);
  return match?.id ?? ADMIN_DEPARTMENT_OPTIONS[0].id;
}
