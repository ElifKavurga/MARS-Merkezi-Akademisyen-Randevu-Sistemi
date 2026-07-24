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

/** Statistics for charts */
export interface HodAcademicianStatsDto {
  /** [status, count] */
  statusDistribution: { status: string; count: number }[];
  /** [categoryName, count] */
  categoryDistribution: { categoryName: string; count: number }[];
  /** Weekly trend, ordered by date */
  weeklyTrend: { date: string; count: number }[];
  /** Monthly trend, ordered by year-month */
  monthlyTrend: { yearMonth: string; count: number }[];
}
