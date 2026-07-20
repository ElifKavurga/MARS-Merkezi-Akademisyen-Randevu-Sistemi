export type StudentAppointmentCategory = {
  categoryId: number;
  categoryName: string;
  description: string | null;
  durationMinutes: number;
  categoryGroup: string;
  requiresCourseSelection: boolean;
};

export type StudentAppointmentDraft = {
  categoryId: number;
  categoryName: string;
  durationMinutes: number;
  categoryGroup: string;
  requiresCourseSelection: boolean;
  description: string | null;
};
