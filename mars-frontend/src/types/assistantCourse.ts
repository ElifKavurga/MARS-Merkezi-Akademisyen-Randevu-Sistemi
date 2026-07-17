export type AssistantAssignedCourse = {
  courseId: number;
  courseCode: string;
  courseName: string;
  academicTerm: string;
  ownerAcademicianName: string;
};

export type AssistantDashboardSummary = {
  assignedCourseCount: number;
  relatedAcademicianCount: number;
  assignedCoursesPreview: AssistantAssignedCourse[];
};
