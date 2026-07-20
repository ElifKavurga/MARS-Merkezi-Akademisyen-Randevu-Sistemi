export type StudentAppointmentCategory = {
  categoryId: number;
  categoryName: string;
  description: string | null;
  durationMinutes: number;
  categoryGroup: string;
  requiresCourseSelection: boolean;
};

export type StudentAppointmentCourseOption = {
  courseId: number;
  courseCode: string;
  courseName: string;
  academicTerm: string;
};

export type StudentAppointmentDraft = {
  categoryId: number;
  categoryName: string;
  durationMinutes: number;
  categoryGroup: string;
  requiresCourseSelection: boolean;
  description: string | null;
  courseId: number | null;
  courseCode: string | null;
  courseName: string | null;
};
