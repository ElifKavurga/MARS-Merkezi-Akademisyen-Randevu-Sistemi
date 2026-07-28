import { useMemo } from 'react';
import {
  formatDurationLabel,
  getMeetingTypeIcon,
  getTimeRangeDurationMinutes,
} from '../constants/calendar';
import { getAppointmentStatusLabel, getMeetingTypeLabel } from '../constants/appointment';
import { STUDENT_APPOINTMENT_STATUS_EVENT_COLORS } from '../constants/studentAppointment';
import type { StudentAppointmentListItem } from '../types/studentAppointment';

type StudentAppointmentsCalendarProps = {
  appointments: StudentAppointmentListItem[];
  onAppointmentClick: (appointment: StudentAppointmentListItem) => void;
};

const START_HOUR = 8;
const END_HOUR = 17;
const HOUR_COUNT = END_HOUR - START_HOUR;
const HOURS = Array.from({ length: HOUR_COUNT }, (_, index) => START_HOUR + index);

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonday(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function isWeekday(isoDate: string): boolean {
  const day = new Date(`${isoDate}T00:00:00`).getDay();
  return day >= 1 && day <= 5;
}

function overlapsVisibleHours(appointment: StudentAppointmentListItem): boolean {
  const dayStart = START_HOUR * 60;
  const dayEnd = END_HOUR * 60;
  return parseTimeToMinutes(appointment.startTime) < dayEnd
    && parseTimeToMinutes(appointment.endTime) > dayStart;
}

function shouldRenderAppointment(appointment: StudentAppointmentListItem): boolean {
  return appointment.appointmentStatus !== 'REJECTED'
    && isWeekday(appointment.appointmentDate)
    && overlapsVisibleHours(appointment);
}

function getAppointmentPosition(appointment: StudentAppointmentListItem) {
  const dayStart = START_HOUR * 60;
  const dayEnd = END_HOUR * 60;
  const start = Math.max(dayStart, parseTimeToMinutes(appointment.startTime));
  const end = Math.min(dayEnd, parseTimeToMinutes(appointment.endTime));
  const total = dayEnd - dayStart;
  const left = ((start - dayStart) / total) * 100;
  const width = (Math.max(end - start, 20) / total) * 100;
  return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
}

function getAppointmentColor(appointment: StudentAppointmentListItem): string {
  return STUDENT_APPOINTMENT_STATUS_EVENT_COLORS[appointment.appointmentStatus]
    ?? STUDENT_APPOINTMENT_STATUS_EVENT_COLORS.DEFAULT;
}

function AppointmentChip({
  appointment,
  stackIndex,
  onOpen,
}: {
  appointment: StudentAppointmentListItem;
  stackIndex: number;
  onOpen: (appointment: StudentAppointmentListItem) => void;
}) {
  const duration = getTimeRangeDurationMinutes(appointment.startTime, appointment.endTime);
  const color = getAppointmentColor(appointment);
  const tooltip = [
    `Akademisyen: ${appointment.staffName}`,
    `Kategori: ${appointment.categoryName || '-'}`,
    `Saat: ${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`,
    `Süre: ${formatDurationLabel(duration)}`,
    `Görüşme Türü: ${getMeetingTypeLabel(appointment.meetingType)}`,
    `Durum: ${getAppointmentStatusLabel(appointment.appointmentStatus)}`,
  ].join('\n');

  return (
    <button
      type="button"
      className="absolute flex h-[1.55rem] min-w-[5.5rem] items-center gap-1 overflow-hidden rounded-md border px-2 text-left text-[11px] font-semibold leading-none text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
      style={{
        ...getAppointmentPosition(appointment),
        top: `${0.35 + stackIndex * 1.8}rem`,
        backgroundColor: color,
        borderColor: color,
      }}
      title={tooltip}
      aria-label={tooltip.replaceAll('\n', ', ')}
      onClick={() => onOpen(appointment)}
    >
      <span className="truncate">{appointment.staffName}</span>
      {duration >= 60 ? (
        <span className="material-symbols-outlined shrink-0 text-[13px]" aria-hidden>
          {getMeetingTypeIcon(appointment.meetingType)}
        </span>
      ) : null}
    </button>
  );
}

export default function StudentAppointmentsCalendar({
  appointments,
  onAppointmentClick,
}: StudentAppointmentsCalendarProps) {
  const days = useMemo(() => {
    const ordered = [...appointments]
      .filter(shouldRenderAppointment)
      .sort((left, right) => {
        const byDate = left.appointmentDate.localeCompare(right.appointmentDate);
        return byDate || left.startTime.localeCompare(right.startTime);
      });
    const baseDate = ordered[0]?.appointmentDate ?? new Date().toISOString().slice(0, 10);
    const monday = getMonday(baseDate);
    const weekDays = Array.from({ length: 5 }, (_, index) => addDays(monday, index));
    const appointmentDays = ordered.map((appointment) => appointment.appointmentDate);
    return Array.from(new Set([...weekDays, ...appointmentDays])).sort();
  }, [appointments]);

  const appointmentsByDate = useMemo(() => {
    const grouped = new Map<string, StudentAppointmentListItem[]>();

    for (const appointment of appointments) {
      if (!shouldRenderAppointment(appointment)) continue;
      const dayAppointments = grouped.get(appointment.appointmentDate) ?? [];
      dayAppointments.push(appointment);
      grouped.set(appointment.appointmentDate, dayAppointments);
    }

    for (const dayAppointments of grouped.values()) {
      dayAppointments.sort((left, right) => {
        const byStart = left.startTime.localeCompare(right.startTime);
        if (byStart !== 0) return byStart;
        return left.staffName.localeCompare(right.staffName);
      });
    }

    return grouped;
  }, [appointments]);

  return (
    <div className="mars-calendar academician-calendar student-appointments-calendar h-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-1.5 sm:p-2">
      <div className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-md border border-outline-variant/70 bg-surface">
        <div className="grid grid-cols-[6.5rem_repeat(9,minmax(0,1fr))] border-b border-outline-variant/70 bg-surface-container-lowest text-label-sm font-semibold text-on-surface-variant">
          <div className="border-r border-outline-variant/70 px-2 py-2">Tarih</div>
          {HOURS.map((hour) => (
            <div key={hour} className="border-r border-outline-variant/40 px-1 py-2 text-center last:border-r-0">
              {formatHour(hour)}
            </div>
          ))}
        </div>

        <div
          className="grid min-h-full overflow-y-auto"
          style={{
            gridTemplateRows: days
              .map((day) => {
                const dayAppointments = appointmentsByDate.get(day) ?? [];
                return `minmax(${Math.max(4.25, dayAppointments.length * 1.8 + 0.9)}rem, 1fr)`;
              })
              .join(' '),
          }}
        >
          {days.map((day) => {
            const dayAppointments = appointmentsByDate.get(day) ?? [];

            return (
              <div
                key={day}
                className="grid grid-cols-[6.5rem_1fr] border-b border-outline-variant/50 last:border-b-0"
              >
                <div className="flex items-center border-r border-outline-variant/70 bg-surface-container-lowest px-2 font-label-sm text-label-sm font-semibold text-on-surface">
                  {formatDayLabel(day)}
                </div>
                <div className="relative min-w-0 bg-[linear-gradient(to_right,rgba(198,197,208,.45)_1px,transparent_1px)] bg-[length:calc(100%/9)_100%]">
                  {dayAppointments.map((appointment, index) => (
                    <AppointmentChip
                      key={appointment.appointmentId}
                      appointment={appointment}
                      stackIndex={index}
                      onOpen={onAppointmentClick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
