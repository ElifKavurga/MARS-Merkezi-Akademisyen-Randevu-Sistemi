import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';
import {
  exclusiveEndToInclusiveIso,
  formatCalendarEventTitle,
  getCalendarEventColor,
  toFullCalendarDateTime,
  toLocalIsoDate,
} from '../constants/calendar';
import type { CalendarDateRange, CalendarEvent } from '../types/calendar';

type AcademicianCalendarProps = {
  events: CalendarEvent[];
  onRangeChange: (range: CalendarDateRange) => void;
  onEventClick: (event: CalendarEvent) => void;
};

export default function AcademicianCalendar({
  events,
  onRangeChange,
  onEventClick,
}: AcademicianCalendarProps) {
  const calendarEvents = useMemo(
    () =>
      events.map((event) => {
        const color = getCalendarEventColor(event);
        return {
          id: `${event.slotId}-${event.slotDate}-${event.startTime}`,
          title: formatCalendarEventTitle(event),
          start: toFullCalendarDateTime(event.slotDate, event.startTime),
          end: toFullCalendarDateTime(event.slotDate, event.endTime),
          backgroundColor: color,
          borderColor: color,
          textColor: '#ffffff',
          extendedProps: { calendarEvent: event },
        };
      }),
    [events],
  );

  const handleDatesSet = (arg: DatesSetArg) => {
    onRangeChange({
      from: toLocalIsoDate(arg.start),
      to: exclusiveEndToInclusiveIso(arg.end),
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const calendarEvent = arg.event.extendedProps.calendarEvent as CalendarEvent | undefined;
    if (calendarEvent) {
      onEventClick(calendarEvent);
    }
  };

  return (
    <div className="academician-calendar rounded-xl border border-outline-variant bg-surface p-2 sm:p-4 overflow-x-auto">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonText={{
          today: 'Bugün',
          month: 'Aylık',
          week: 'Haftalık',
          day: 'Günlük',
        }}
        locale={trLocale}
        height="auto"
        weekends
        nowIndicator
        editable={false}
        selectable={false}
        events={calendarEvents}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        dayMaxEvents
      />
    </div>
  );
}
