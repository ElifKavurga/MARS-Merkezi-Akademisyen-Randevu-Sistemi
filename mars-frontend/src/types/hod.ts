export interface HodAcademicianListDto {
  userId: number;
  fullName: string;
  academicTitle: string | null;
  activeOfficeHoursCount: number;
  todayAppointmentsCount: number;
  pendingAppointmentsCount: number;
  totalAppointmentsCount: number;
}
