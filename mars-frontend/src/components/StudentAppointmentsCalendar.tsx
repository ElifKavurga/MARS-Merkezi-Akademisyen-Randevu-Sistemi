import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import trLocale from '@fullcalendar/core/locales/tr';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import { toFullCalendarDateTime } from '../constants/calendar';
import { STUDENT_APPOINTMENT_STATUS_EVENT_COLORS } from '../constants/studentAppointment';
import type { StudentAppointmentListItem } from '../types/studentAppointment';

function formatStartTime(time: string): string {
  return time.slice(0, 5);
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
    () =>
      appointments.map((appointment) => {
        const color =
          STUDENT_APPOINTMENT_STATUS_EVENT_COLORS[appointment.appointmentStatus]
          ?? STUDENT_APPOINTMENT_STATUS_EVENT_COLORS.DEFAULT;
        return {
          id: String(appointment.appointmentId),
          title: `${formatStartTime(appointment.startTime)} ${appointment.staffName}`,
          start: toFullCalendarDateTime(appointment.appointmentDate, appointment.startTime),
          end: toFullCalendarDateTime(appointment.appointmentDate, appointment.endTime),
          backgroundColor: color,
          borderColor: color,
          textColor: '#ffffff',
          extendedProps: { appointment },
        };
      }),
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
    const time = appointment
      ? formatStartTime(appointment.startTime)
      : arg.timeText;
    const name = appointment?.staffName ?? arg.event.title;

    return (
      <div className="flex h-full w-full flex-col justify-center gap-0.5 overflow-hidden px-0.5 leading-tight">
        <span className="truncate font-semibold">{time}</span>
        <span className="truncate opacity-95">{name}</span>
      </div>
    );
  };

  return (
    // Same filtered dataset as list view — no extra API fetch.
    <div className="academician-calendar student-appointments-calendar overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-2 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
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
        height="auto"
        weekends
        nowIndicator
        editable={false}
        selectable={false}
        events={calendarEvents}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        dayMaxEvents
      />
    </div>
  );
}
