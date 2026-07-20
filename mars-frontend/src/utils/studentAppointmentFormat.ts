import type { StudentAppointmentListItem } from '../types/studentAppointment';

/** Display date in tr-TR (ISO date string YYYY-MM-DD). */
export function formatStudentAppointmentDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

/** HH:mm from LocalTime / ISO time string. */
export function formatStudentAppointmentTime(time: string): string {
  return time.slice(0, 5);
}

export function formatStudentAppointmentCourseLabel(
  appointment: Pick<StudentAppointmentListItem, 'courseCode' | 'courseName'>,
): string | null {
  if (!appointment.courseCode && !appointment.courseName) {
    return null;
  }
  if (appointment.courseCode && appointment.courseName) {
    return `${appointment.courseCode} — ${appointment.courseName}`;
  }
  return appointment.courseCode ?? appointment.courseName ?? null;
}
