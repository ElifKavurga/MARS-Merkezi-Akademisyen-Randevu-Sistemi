import type { StudentAppointmentListItem } from '../types/studentAppointment';

const ACTIVE_STATUSES = new Set(['PENDING', 'APPROVED']);

/** Europe/Istanbul is UTC+3 year-round (no DST). Matches backend APP_ZONE. */
const ISTANBUL_OFFSET = '+03:00';

function parseAppointmentEnd(appointmentDate: string, endTime: string): Date | null {
  const time = endTime.slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  const end = new Date(`${appointmentDate}T${time}:00${ISTANBUL_OFFSET}`);
  return Number.isNaN(end.getTime()) ? null : end;
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
