import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import trLocale from '@fullcalendar/core/locales/tr';
import type { EventClickArg, EventContentArg, EventMountArg } from '@fullcalendar/core';
import {
  formatDurationLabel,
  getMeetingTypeIcon,
  getTimeRangeDurationMinutes,
  toFullCalendarDateTime,
} from '../constants/calendar';
import { getAppointmentStatusLabel, getMeetingTypeLabel } from '../constants/appointment';
import { STUDENT_APPOINTMENT_STATUS_EVENT_COLORS } from '../constants/studentAppointment';
import type { StudentAppointmentListItem } from '../types/studentAppointment';

function formatStartTime(time: string): string {
  return time.slice(0, 5);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}:00`;
}

type StudentAppointmentsCalendarProps = {
  appointments: StudentAppointmentListItem[];
  onAppointmentClick: (appointment: StudentAppointmentListItem) => void;
};

export default function StudentAppointmentsCalendar({
  appointments,
  onAppointmentClick,
}: StudentAppointmentsCalendarProps) {
  const calendarEvents = useMemo(
    () => {
      const ordered = [...appointments].sort((left, right) => {
        const byDate = left.appointmentDate.localeCompare(right.appointmentDate);
        return byDate || left.startTime.localeCompare(right.startTime);
      });
      const visualStarts = new Map<number, string>();
      const visualEnds = new Map<number, string>();
      let cursor = 0;
      ordered.forEach((appointment, index) => {
        const next = ordered[index + 1];
        const previous = ordered[index - 1];
        if (!previous || previous.appointmentDate !== appointment.appointmentDate) cursor = 0;
        const originalStart = timeToMinutes(appointment.startTime);
        const originalEnd = timeToMinutes(appointment.endTime);
        const visualStart = Math.max(originalStart, cursor);
        const overlapsNext = next != null
          && next.appointmentDate === appointment.appointmentDate
          && timeToMinutes(next.startTime) < originalEnd;
        const wasShifted = visualStart > originalStart;
        const visualEnd = overlapsNext || wasShifted
          ? visualStart + 10
          : Math.max(originalEnd, visualStart + 10);
        visualStarts.set(appointment.appointmentId, minutesToTime(visualStart));
        visualEnds.set(appointment.appointmentId, minutesToTime(visualEnd));
        cursor = visualEnd;
      });

      return appointments.map((appointment) => {
        const color =
          STUDENT_APPOINTMENT_STATUS_EVENT_COLORS[appointment.appointmentStatus]
          ?? STUDENT_APPOINTMENT_STATUS_EVENT_COLORS.DEFAULT;
        return {
          id: String(appointment.appointmentId),
          title: `${formatStartTime(appointment.startTime)} ${appointment.staffName}`,
          start: toFullCalendarDateTime(
            appointment.appointmentDate,
            visualStarts.get(appointment.appointmentId) ?? appointment.startTime,
          ),
          end: toFullCalendarDateTime(
            appointment.appointmentDate,
            visualEnds.get(appointment.appointmentId) ?? appointment.endTime,
          ),
          backgroundColor: color,
          borderColor: color,
          textColor: '#ffffff',
          extendedProps: { appointment },
        };
      });
    },
    [appointments],
  );

  const handleEventClick = (arg: EventClickArg) => {
    const appointment = arg.event.extendedProps.appointment as
      | StudentAppointmentListItem
      | undefined;
    if (appointment) {
      onAppointmentClick(appointment);
    }
  };

  const renderEventContent = (arg: EventContentArg) => {
    const appointment = arg.event.extendedProps.appointment as
      | StudentAppointmentListItem
      | undefined;
    const name = appointment?.staffName ?? arg.event.title;
    const duration = appointment
      ? getTimeRangeDurationMinutes(appointment.startTime, appointment.endTime)
      : 0;

    if (appointment && duration < 30) {
      return (
        <div className="mars-cal-event-body mars-cal-event-body--short flex h-full w-full items-center justify-center overflow-hidden px-1.5 text-center leading-none">
          <span className="truncate text-[10px] font-semibold sm:text-[11px]">{name}</span>
        </div>
      );
    }

    return (
      <div className="mars-cal-event-body flex h-full w-full flex-col items-center justify-center overflow-hidden px-1.5 py-px text-center leading-none">
        <span className="truncate text-[9px] font-bold leading-[10px] sm:text-[10px]">{name}</span>
        {appointment ? (
          <span className="line-clamp-2 w-full whitespace-normal break-words text-left text-[8px] leading-[9px] opacity-90 sm:text-[9px]">
            {appointment.categoryName}
          </span>
        ) : null}
        {appointment && duration >= 60 ? (
          <span className="flex min-w-0 items-center justify-center gap-1 text-[9px] opacity-90 sm:text-[10px]">
            <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
              <span className="material-symbols-outlined text-[11px]" aria-hidden>
                {getMeetingTypeIcon(appointment.meetingType)}
              </span>
              <span className="truncate">{getMeetingTypeLabel(appointment.meetingType)}</span>
            </span>
            <span className="truncate">· {getAppointmentStatusLabel(appointment.appointmentStatus)}</span>
          </span>
        ) : null}
      </div>
    );
  };

  const handleEventDidMount = (arg: EventMountArg) => {
    const appointment = arg.event.extendedProps.appointment as StudentAppointmentListItem | undefined;
    if (!appointment) return;
    const duration = getTimeRangeDurationMinutes(appointment.startTime, appointment.endTime);
    const tooltip = [
      `Akademisyen: ${appointment.staffName}`,
      `Kategori: ${appointment.categoryName || '—'}`,
      `Saat: ${formatStartTime(appointment.startTime)} - ${formatStartTime(appointment.endTime)}`,
      `Süre: ${formatDurationLabel(duration)}`,
      `Görüşme Türü: ${getMeetingTypeLabel(appointment.meetingType)}`,
      `Durum: ${getAppointmentStatusLabel(appointment.appointmentStatus)}`,
    ].join('\n');
    arg.el.title = tooltip;
    arg.el.setAttribute('aria-label', tooltip.replaceAll('\n', ', '));
    arg.el.setAttribute('role', 'button');
    arg.el.tabIndex = 0;
    arg.el.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onAppointmentClick(appointment);
      }
    };
  };

  return (
    // Same filtered dataset as list view — no extra API fetch.
    <div className="mars-calendar academician-calendar student-appointments-calendar h-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-1.5 sm:p-2">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView={window.matchMedia('(max-width: 767px)').matches ? 'timeGridDay' : 'timeGridWeek'}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek',
        }}
        buttonText={{
          today: 'Bugün',
          month: 'Aylık',
          week: 'Haftalık',
        }}
        locale={trLocale}
        height="100%"
        slotDuration="00:10:00"
        slotLabelInterval="01:00:00"
        eventMinHeight={22}
        eventShortHeight={22}
        weekends
        nowIndicator
        editable={false}
        selectable={false}
        events={calendarEvents}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        eventDidMount={handleEventDidMount}
        slotEventOverlap={false}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        stickyHeaderDates
        dayMaxEvents
      />
    </div>
  );
}
