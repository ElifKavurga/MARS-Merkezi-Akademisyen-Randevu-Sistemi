export const ROUTES = {
  HOME: '/',
  LOGIN: '/giris',
  RESET_PASSWORD: '/sifre-sifirlama',
  DASHBOARD: '/dashboard',
  NOTIFICATIONS: '/bildirimler',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/kullanicilar',
  ADMIN_CATEGORIES: '/admin/kategoriler',
  ADMIN_PENALTY_RULES: '/admin/ceza-kurallari',
  ADMIN_PROFILE: '/admin/profil',
  HOD: '/bolum-baskani',
  ACADEMICIAN: '/akademisyen',
  ACADEMICIAN_COURSES: '/academician/courses',
  ACADEMICIAN_COURSE_DETAIL: '/academician/courses/:courseId',
  ACADEMICIAN_AVAILABILITY: '/academician/availability',
  ACADEMICIAN_APPOINTMENTS: '/academician/appointments',
  ACADEMICIAN_APPOINTMENT_DETAIL: '/academician/appointments/:appointmentId',
  ACADEMICIAN_DELEGATION_HISTORY: '/academician/delegations/history',
  ACADEMICIAN_INCOMING_DELEGATIONS: '/academician/delegations/incoming',
  ACADEMICIAN_CALENDAR: '/academician/calendar',
  ACADEMICIAN_OUT_OF_OFFICE: '/academician/out-of-office',
  ACADEMICIAN_PROFILE: '/academician/profile',
  ASSISTANT: '/assistant',
  ASSISTANT_DASHBOARD: '/assistant/dashboard',
  ASSISTANT_COURSES: '/assistant/courses',
  ASSISTANT_AVAILABILITY: '/assistant/availability',
  ASSISTANT_APPOINTMENTS: '/assistant/appointments',
  ASSISTANT_INCOMING_DELEGATIONS: '/assistant/delegations/incoming',
  ASSISTANT_DELEGATION_HISTORY: '/assistant/delegations/history',
  ASSISTANT_CALENDAR: '/assistant/calendar',
  ASSISTANT_PROFILE: '/assistant/profile',
  STUDENT: '/ogrenci',
  STUDENT_APPOINTMENTS: '/ogrenci/randevularim',
  STUDENT_APPOINTMENT_DETAIL: '/ogrenci/randevularim/:appointmentId',
  STUDENT_APPOINTMENT_CREATE: '/ogrenci/randevu-olustur/:academicianId',
  STUDENT_ACADEMICIAN_SEARCH: '/ogrenci/akademisyen-ara',
  STUDENT_ACADEMICIAN_PROFILE: '/ogrenci/akademisyen/:userId',
  STUDENT_PROFILE: '/ogrenci/profil',
} as const;

export function academicianCourseDetailPath(courseId: number | string): string {
  return `/academician/courses/${courseId}`;
}

export function academicianAppointmentDetailPath(appointmentId: number | string): string {
  return `/academician/appointments/${appointmentId}`;
}

export function studentAcademicianProfilePath(userId: number | string): string {
  return `/ogrenci/akademisyen/${userId}`;
}

export function studentAppointmentCreatePath(academicianId: number | string): string {
  return `/ogrenci/randevu-olustur/${academicianId}`;
}

export function studentAppointmentDetailPath(appointmentId: number | string): string {
  return `/ogrenci/randevularim/${appointmentId}`;
}

export function academicianDelegationHistoryPath(status?: string): string {
  if (!status) {
    return ROUTES.ACADEMICIAN_DELEGATION_HISTORY;
  }
  return `${ROUTES.ACADEMICIAN_DELEGATION_HISTORY}?status=${encodeURIComponent(status)}`;
}

export function assistantDelegationHistoryPath(status?: string): string {
  if (!status) {
    return ROUTES.ASSISTANT_DELEGATION_HISTORY;
  }
  return `${ROUTES.ASSISTANT_DELEGATION_HISTORY}?status=${encodeURIComponent(status)}`;
}
