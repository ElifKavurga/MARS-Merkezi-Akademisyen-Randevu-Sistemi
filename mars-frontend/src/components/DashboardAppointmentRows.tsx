import { getMeetingTypeLabel } from '../constants/appointment';
import type { StaffAppointment } from '../types/appointment';
import AppointmentStatusBadge from './AppointmentStatusBadge';

export function DashboardUpcomingAppointmentRow({
  appointment,
}: {
  appointment: StaffAppointment;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg px-2 py-4 transition-colors hover:bg-surface-bright sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex min-w-0 items-center gap-4">
        <StudentAvatar name={appointment.studentName} />
        <div className="min-w-0">
          <p className="truncate font-body-md text-body-md font-semibold text-primary">
            {appointment.studentName}
          </p>
          <p className="mt-1 font-label-sm text-label-sm text-outline">
            {appointment.categoryName} · {formatDate(appointment.appointmentDate)}
          </p>
          <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
            {formatTimeRange(appointment)}
            {' · '}
            {formatCourse(appointment)}
            {' · '}
            {getMeetingTypeLabel(appointment.meetingType)}
          </p>
        </div>
      </div>
      <div className="self-start sm:self-auto">
        <AppointmentStatusBadge status={appointment.appointmentStatus} />
      </div>
    </div>
  );
}

export function DashboardPendingAppointmentRow({
  appointment,
}: {
  appointment: StaffAppointment;
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4">
      <div className="flex items-start gap-3">
        <StudentAvatar name={appointment.studentName} compact />
        <div className="min-w-0 flex-1">
          <p className="truncate font-body-md text-body-md font-semibold text-primary">
            {appointment.studentName}
          </p>
          <p className="mt-1 truncate font-label-sm text-label-sm text-outline">
            {appointment.categoryName}
          </p>
          <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
            {formatDate(appointment.appointmentDate)} · {formatTimeRange(appointment)}
          </p>
          <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
            {formatCourse(appointment)} · {getMeetingTypeLabel(appointment.meetingType)}
          </p>
        </div>
      </div>
    </div>
  );
}

function StudentAvatar({ name, compact = false }: { name: string; compact?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('');

  return (
    <div
      className={`${compact ? 'h-10 w-10 text-sm' : 'h-12 w-12'} flex shrink-0 items-center justify-center rounded-full bg-surface-container font-bold text-primary`}
      aria-hidden="true"
    >
      {initials || 'Ö'}
    </div>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTimeRange(appointment: StaffAppointment): string {
  return `${appointment.startTime.slice(0, 5)} - ${appointment.endTime.slice(0, 5)}`;
}

function formatCourse(appointment: StaffAppointment): string {
  return appointment.courseName
    ? `${appointment.courseCode ?? ''} ${appointment.courseName}`.trim()
    : '-';
}
