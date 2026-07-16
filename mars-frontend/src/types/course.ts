export type Course = {
  courseId: number;
  courseCode: string;
  courseName: string;
  academicTerm: string;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CourseCreatePayload = {
  courseCode: string;
  courseName: string;
  academicTerm: string;
  departmentId: number;
};

export type CourseUpdatePayload = CourseCreatePayload;

export type CourseStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

export type CourseAssistant = {
  assignmentId: number;
  assistantId: number;
  assistantName: string;
  institutionalEmail: string;
  departmentName: string;
  assignedAt: string;
};

export type CourseDetail = {
  courseId: number;
  courseCode: string;
  courseName: string;
  academicTerm: string;
  departmentName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CourseStats = {
  totalAssistantCount: number;
  isActive: boolean;
  academicTerm: string;
  departmentName: string;
};

export type CourseAssistantCreatePayload = {
  assistantId: number;
};

export type CourseAssignmentUpdatePayload = {
  assistantId: number;
};

export type AssistantUserOption = {
  userId: number;
  fullName: string;
  institutionalEmail: string;
  departmentName: string;
};
