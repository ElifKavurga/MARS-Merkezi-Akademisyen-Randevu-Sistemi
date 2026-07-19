import type { StaffAppointment } from './appointment';

export type AcademicianDashboardSummary = {
  pendingAppointmentCount: number;
  upcomingAppointmentCount: number;
  activeCourseCount: number;
  pendingDelegationCount: number;
  acceptedDelegationCount: number;
  rejectedDelegationCount: number;
  pendingAppointments: StaffAppointment[];
  upcomingAppointments: StaffAppointment[];
};
