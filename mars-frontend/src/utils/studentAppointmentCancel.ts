import type { StudentAppointmentListItem } from '../types/studentAppointment';

const ACTIVE_STATUSES = new Set(['PENDING', 'APPROVED']);

function parseAppointmentEnd(appointmentDate: string, endTime: string): Date | null {
  const [year, month, day] = appointmentDate.split('-').map(Number);
  const [hour, minute] = endTime.slice(0, 5).split(':').map(Number);
  if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
    return null;
  }
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/** SRS: aktif (PENDING/APPROVED) ve geçmiş olmayan randevular iptal edilebilir. */
export function isStudentAppointmentCancellable(
  appointment: Pick<StudentAppointmentListItem, 'appointmentStatus' | 'appointmentDate' | 'endTime'>,
  now = new Date(),
): boolean {
  if (!ACTIVE_STATUSES.has(appointment.appointmentStatus)) {
    return false;
  }
  const end = parseAppointmentEnd(appointment.appointmentDate, appointment.endTime);
  if (!end) {
    return false;
  }
  return end.getTime() >= now.getTime();
}
