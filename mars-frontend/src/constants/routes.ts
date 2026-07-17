export const ROUTES = {
  HOME: '/',
  LOGIN: '/giris',
  RESET_PASSWORD: '/sifre-sifirlama',
  DASHBOARD: '/dashboard',
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
  ACADEMICIAN_CALENDAR: '/academician/calendar',
  ACADEMICIAN_OUT_OF_OFFICE: '/academician/out-of-office',
  ASSISTANT: '/assistant',
  ASSISTANT_DASHBOARD: '/assistant/dashboard',
  ASSISTANT_COURSES: '/assistant/courses',
  ASSISTANT_AVAILABILITY: '/assistant/availability',
  ASSISTANT_APPOINTMENTS: '/assistant/appointments',
  STUDENT: '/ogrenci',
  STUDENT_APPOINTMENT_CREATE: '/ogrenci/randevu-olustur',
} as const;

export function academicianCourseDetailPath(courseId: number | string): string {
  return `/academician/courses/${courseId}`;
}
