import type { StaffAppointment } from './appointment';

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
  pendingAppointmentCount: number;
  upcomingAppointmentCount: number;
  pendingDelegationCount: number;
  acceptedDelegationCount: number;
  rejectedDelegationCount: number;
  pendingAppointments: StaffAppointment[];
  upcomingAppointments: StaffAppointment[];
};
