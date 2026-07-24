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

export interface HodRecentAppointmentDto {
  appointmentId: number;
  date: string;
  startTime: string;
  endTime: string;
  studentName: string;
  categoryName: string;
  status: string;
  meetingType: string;
  durationMinutes: number;
}

export interface HodPerformanceSummaryDto {
  totalCompleted: number;
  averageDaily: number;
  noShowCount: number;
  noShowRate: number;
  averageResponseTime: string;
  busiestDay: string;
  busiestTimeRange: string;
}

export interface HodDepartmentKpiDto {
  totalAcademicians: number;
  activeAcademicians: number;
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  noShowCount: number;
  waitlistStudentCount: number;
}

export interface HodDepartmentStatsDto {
  statusDistribution: { status: string; count: number }[];
  categoryDistribution: { categoryName: string; count: number }[];
  weeklyTrend: { date: string; count: number }[];
  monthlyTrend: { yearMonth: string; count: number }[];
}
export interface HodDepartmentAnalysisDto {
  noShowAnalysis: {
    totalNoShow: number;
    noShowRate: number;
    mostNoShowDay: string;
    mostNoShowTimeRange: string;
  };
  waitlistAnalysis: {
    totalWaitlistStudents: number;
    topWaitlistCategories: string[];
    convertedToAppointmentCount: number;
    averageWaitTime: string;
  };
  generalAnalysis: {
    busiestAcademician: string;
    avgDailyAppointments: number;
    avgWeeklyAppointments: number;
    busiestCategory: string;
    busiestDay: string;
    busiestTimeRange: string;
  };
}
