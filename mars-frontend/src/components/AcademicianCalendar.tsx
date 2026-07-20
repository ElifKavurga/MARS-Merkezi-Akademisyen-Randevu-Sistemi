import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import type { DatesSetArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core';
import {
  exclusiveEndToInclusiveIso,
  formatCalendarEventTitle,
  formatCalendarTimeRange,
  getAppointmentBusyLaneColor,
  getCalendarEventStyle,
  getCalendarVisualEndTime,
  getMeetingTypeIcon,
  shouldRenderAppointmentBusyLane,
  toFullCalendarDateTime,
  toLocalIsoDate,
} from '../constants/calendar';
import { getMeetingTypeLabel } from '../constants/appointment';
import type { CalendarDateRange, CalendarEvent } from '../types/calendar';

type AcademicianCalendarProps = {
  events: CalendarEvent[];
  initialDate?: string;
  onRangeChange: (range: CalendarDateRange) => void;
  onEventClick: (event: CalendarEvent) => void;
};

function EventBody({
  event,
  dense,
}: {
  event: CalendarEvent;
  dense: boolean;
}) {
  const timeRange = formatCalendarTimeRange(event);
  const isAppointment = event.eventType === 'APPOINTMENT';
  const meetingIcon = getMeetingTypeIcon(event.meetingType);
  const meetingLabel = getMeetingTypeLabel(event.meetingType);

  if (isAppointment) {
    return (
      <div className="mars-cal-event-body flex w-full flex-col justify-center gap-0.5 overflow-hidden px-1 py-0.5 leading-tight">
        <span className="truncate font-semibold">{timeRange}</span>
        <span className="truncate">{event.studentName?.trim() || 'Öğrenci'}</span>
        <span className="inline-flex min-w-0 items-center gap-0.5 truncate opacity-95">
          <span className="material-symbols-outlined text-[12px] leading-none" aria-hidden>
            {meetingIcon}
          </span>
          {!dense ? <span className="truncate">{meetingLabel}</span> : null}
        </span>
      </div>
    );
  }

  const availabilityLabel = event.isBlocked
    ? 'Engelli'
    : event.recurrenceRuleId != null
      ? 'Tekrarlayan müsait'
      : 'Müsait';

  return (
    <div className="mars-cal-event-body flex h-full min-h-0 w-full flex-col justify-start gap-0.5 overflow-hidden px-1 py-0.5 leading-tight">
      <span className="truncate font-semibold">{timeRange}</span>
      <span className="truncate">{availabilityLabel}</span>
      {!dense ? (
        <span className="inline-flex min-w-0 items-center gap-0.5 truncate opacity-90">
          <span className="material-symbols-outlined text-[12px] leading-none" aria-hidden>
            {meetingIcon}
          </span>
          <span className="truncate">{meetingLabel}</span>
        </span>
      ) : null}
    </div>
  );
}

function toCalendarInputs(events: CalendarEvent[]): EventInput[] {
  const inputs: EventInput[] = [];

  for (const event of events) {
    const style = getCalendarEventStyle(event);
    const eventKey = `${event.eventType}-${event.appointmentId ?? event.slotId}-${event.slotDate}-${event.startTime}`;

    if (shouldRenderAppointmentBusyLane(event)) {
      inputs.push({
        id: `busy-${eventKey}`,
        start: toFullCalendarDateTime(event.slotDate, event.startTime),
        end: toFullCalendarDateTime(event.slotDate, event.endTime),
        display: 'background',
        backgroundColor: getAppointmentBusyLaneColor(event),
        classNames: ['mars-cal-busy-lane'],
        extendedProps: { calendarEvent: event, isBusyLane: true },
      });
    }

    inputs.push({
      id: eventKey,
      title: formatCalendarEventTitle(event),
      start: toFullCalendarDateTime(event.slotDate, event.startTime),
      end: toFullCalendarDateTime(event.slotDate, getCalendarVisualEndTime(event)),
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      textColor: style.textColor,
      classNames: style.classNames,
      extendedProps: { calendarEvent: event, isBusyLane: false },
    });
  }

  return inputs;
}

export default function AcademicianCalendar({
  events,
  initialDate,
  onRangeChange,
  onEventClick,
}: AcademicianCalendarProps) {
  const calendarEvents = useMemo(() => toCalendarInputs(events), [events]);

  const handleDatesSet = (arg: DatesSetArg) => {
    onRangeChange({
      from: toLocalIsoDate(arg.start),
      to: exclusiveEndToInclusiveIso(arg.end),
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    if (arg.event.display === 'background') {
      return;
    }
    const calendarEvent = arg.event.extendedProps.calendarEvent as CalendarEvent | undefined;
    if (calendarEvent) {
      onEventClick(calendarEvent);
    }
  };

  const renderEventContent = (arg: EventContentArg) => {
    if (arg.event.display === 'background') {
      return true;
    }
    const calendarEvent = arg.event.extendedProps.calendarEvent as CalendarEvent | undefined;
    if (!calendarEvent) {
      return <span className="truncate px-1">{arg.event.title}</span>;
    }
    const dense = arg.view.type === 'dayGridMonth';
    return <EventBody event={calendarEvent} dense={dense} />;
  };

  return (
    <div className="academician-calendar overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-2 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={initialDate}
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
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        eventMinHeight={52}
        expandRows={false}
        weekends
        nowIndicator
        editable={false}
        selectable={false}
        displayEventTime={false}
        events={calendarEvents}
        datesSet={handleDatesSet}
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
