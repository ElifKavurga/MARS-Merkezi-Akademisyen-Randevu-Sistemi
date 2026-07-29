export type AppointmentCategory = {
  categoryId: number;
  categoryName: string;
  durationMinutes: number;
  categoryGroup: string;
  requiresCourseSelection: boolean;
};

export type AppointmentCategoryPayload = {
  categoryName: string;
  durationMinutes: number;
  categoryGroup: string;
  requiresCourseSelection: boolean;
};

export const CATEGORY_GROUP_OPTIONS = [
  { value: 'ACADEMIC', label: 'Akademik' },
  { value: 'COURSE_EXAM', label: 'Ders / Sınav' },
  { value: 'ADMINISTRATIVE', label: 'İdari' },
] as const;

export const CATEGORY_GROUP_LABELS: Record<string, string> = {
  ACADEMIC: 'Akademik',
  COURSE_EXAM: 'Ders / Sınav',
  ADMINISTRATIVE: 'İdari',
};

export function getCategoryGroupLabel(categoryGroup: string): string {
  return CATEGORY_GROUP_LABELS[categoryGroup] ?? categoryGroup;
}
