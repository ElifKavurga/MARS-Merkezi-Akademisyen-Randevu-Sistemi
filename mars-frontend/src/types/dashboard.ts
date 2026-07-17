import type { StaffAppointment } from './appointment';

export type AcademicianDashboardSummary = {
  pendingAppointmentCount: number;
  upcomingAppointmentCount: number;
  activeCourseCount: number;
  pendingAppointments: StaffAppointment[];
  upcomingAppointments: StaffAppointment[];
};
