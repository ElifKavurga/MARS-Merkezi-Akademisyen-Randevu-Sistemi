export type Course = {
  courseId: number;
  courseCode: string;
  courseName: string;
  academicTerm: string;
  departmentId: number;
  departmentName: string;
};

export type CourseCreatePayload = {
  courseCode: string;
  courseName: string;
  academicTerm: string;
  departmentId: number;
};
