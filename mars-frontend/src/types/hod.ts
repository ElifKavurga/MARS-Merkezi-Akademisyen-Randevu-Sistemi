export interface HodAcademicianListDto {
  userId: number;
  fullName: string;
  academicTitle: string | null;
  activeOfficeHoursCount: number;
  todayAppointmentsCount: number;
  pendingAppointmentsCount: number;
  totalAppointmentsCount: number;
}

export interface HodAcademicianDetailDto {
  userId: number;
  fullName: string;
  academicTitle: string | null;
  departmentName: string;
  institutionalEmail: string;
  activeOfficeHoursCount: number;
  todayAppointmentsCount: number;
  pendingAppointmentsCount: number;
  totalAppointmentsCount: number;
}
