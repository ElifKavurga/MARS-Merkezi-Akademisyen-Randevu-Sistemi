export type Course = {
  courseId: number;
  courseCode: string;
  courseName: string;
  academicTerm: string;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
};

export type CourseCreatePayload = {
  courseCode: string;
  courseName: string;
  academicTerm: string;
  departmentId: number;
};

export type CourseUpdatePayload = CourseCreatePayload;

export type CourseStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';
