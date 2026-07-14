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
  { value: 'ACADEMIC', label: 'ACADEMIC' },
  { value: 'COURSE_EXAM', label: 'COURSE_EXAM' },
  { value: 'ADMINISTRATIVE', label: 'ADMINISTRATIVE' },
] as const;
