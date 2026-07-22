import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import type { DatesSetArg, EventClickArg, EventContentArg, EventInput, EventMountArg } from '@fullcalendar/core';
import {
  exclusiveEndToInclusiveIso,
  formatCalendarEventTitle,
  formatCalendarEventTooltip,
  formatCalendarTimeRange,
  getAppointmentDurationMinutes,
  getCalendarEventStyle,
  getCalendarVisualEndTime,
  getMeetingTypeIcon,
  toFullCalendarDateTime,
  toLocalIsoDate,
} from '../constants/calendar';
import { getAppointmentStatusLabel, getMeetingTypeLabel } from '../constants/appointment';
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
  const duration = getAppointmentDurationMinutes(event);

  if (isAppointment) {
    if (duration < 30) {
      return (
        <div className="mars-cal-event-body mars-cal-event-body--short flex h-full w-full items-center justify-center overflow-hidden px-1.5 text-center leading-none">
          <span className="truncate text-[10px] font-semibold sm:text-[11px]">{event.studentName?.trim() || 'Öğrenci'}</span>
        </div>
      );
    }
    return (
      <div className="mars-cal-event-body flex h-full w-full flex-col items-center justify-center overflow-hidden px-1.5 py-px text-center leading-none">
        <span className="truncate text-[9px] font-bold leading-[10px] sm:text-[10px]">{event.studentName?.trim() || 'Öğrenci'}</span>
        <span className="line-clamp-2 w-full whitespace-normal break-words text-left text-[8px] leading-[9px] opacity-90 sm:text-[9px]">
          {event.categoryName?.trim() || 'Randevu'}
        </span>
        {duration >= 60 ? (
          <span className="flex min-w-0 items-center justify-center gap-1 text-[9px] opacity-90 sm:text-[10px]">
            <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
              <span className="material-symbols-outlined text-[11px]" aria-hidden>{meetingIcon}</span>
              <span className="truncate">{meetingLabel}</span>
            </span>
            <span className="truncate">· {getAppointmentStatusLabel(event.appointmentStatus ?? '')}</span>
          </span>
        ) : null}
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

function mergeAdjacentAvailability(events: CalendarEvent[]): CalendarEvent[] {
  const appointments = events.filter((event) => event.eventType === 'APPOINTMENT');
  const availability = events
    .filter((event) => event.eventType === 'AVAILABILITY')
    .sort((left, right) =>
      `${left.slotDate}-${left.startTime}`.localeCompare(`${right.slotDate}-${right.startTime}`),
    );
  const merged: CalendarEvent[] = [];

  for (const event of availability) {
    const previous = merged.at(-1);
    const joinsPrevious = previous
      && previous.slotDate === event.slotDate
      && previous.endTime === event.startTime
      && previous.isBlocked === event.isBlocked
      && previous.recurrenceRuleId === event.recurrenceRuleId
      && previous.meetingType === event.meetingType;
    if (joinsPrevious) {
      merged[merged.length - 1] = { ...previous, endTime: event.endTime };
    } else {
      merged.push(event);
    }
  }

  return [...merged, ...appointments];
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

function toCalendarInputs(events: CalendarEvent[]): EventInput[] {
  const inputs: EventInput[] = [];
  const renderEvents = mergeAdjacentAvailability(events);
  const visualStarts = new Map<CalendarEvent, string>();
  const visualEnds = new Map<CalendarEvent, string>();
  const appointmentsByDate = new Map<string, CalendarEvent[]>();

  for (const event of renderEvents) {
    if (event.eventType !== 'APPOINTMENT') continue;
    const dayEvents = appointmentsByDate.get(event.slotDate) ?? [];
    dayEvents.push(event);
    appointmentsByDate.set(event.slotDate, dayEvents);
  }

  for (const dayEvents of appointmentsByDate.values()) {
    dayEvents.sort((left, right) => left.startTime.localeCompare(right.startTime));
    let cursor = 0;
    dayEvents.forEach((event, index) => {
      const next = dayEvents[index + 1];
      const originalStart = timeToMinutes(event.startTime);
      const originalEnd = timeToMinutes(event.endTime);
      const visualStart = Math.max(originalStart, cursor);
      const overlapsNext = next != null && timeToMinutes(next.startTime) < originalEnd;
      const wasShifted = visualStart > originalStart;
      const visualEnd = overlapsNext || wasShifted
        ? visualStart + 10
        : Math.max(originalEnd, visualStart + 10);
      visualStarts.set(event, minutesToTime(visualStart));
      visualEnds.set(event, minutesToTime(visualEnd));
      cursor = visualEnd;
    });
  }

  for (const event of renderEvents) {
    const style = getCalendarEventStyle(event);
    const eventKey = `${event.eventType}-${event.appointmentId ?? event.slotId}-${event.slotDate}-${event.startTime}`;

    if (event.eventType === 'AVAILABILITY') {
      if (event.isBlocked) continue;
      inputs.push({
        id: eventKey,
        start: toFullCalendarDateTime(event.slotDate, event.startTime),
        end: toFullCalendarDateTime(event.slotDate, event.endTime),
        display: 'background',
        backgroundColor: style.backgroundColor,
        classNames: style.classNames,
        extendedProps: { calendarEvent: event, isBusyLane: false },
      });
    } else {
      inputs.push({
        id: eventKey,
        title: formatCalendarEventTitle(event),
        start: toFullCalendarDateTime(
          event.slotDate,
          visualStarts.get(event) ?? event.startTime,
        ),
        end: toFullCalendarDateTime(
          event.slotDate,
          visualEnds.get(event) ?? getCalendarVisualEndTime(event),
        ),
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        textColor: style.textColor,
        classNames: style.classNames,
        extendedProps: { calendarEvent: event, isBusyLane: false },
      });
    }
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

  const handleEventDidMount = (arg: EventMountArg) => {
    const calendarEvent = arg.event.extendedProps.calendarEvent as CalendarEvent | undefined;
    if (!calendarEvent || calendarEvent.eventType !== 'APPOINTMENT') return;
    const tooltip = formatCalendarEventTooltip(calendarEvent);
    arg.el.title = tooltip;
    arg.el.setAttribute('aria-label', tooltip.replaceAll('\n', ', '));
    arg.el.setAttribute('role', 'button');
    arg.el.tabIndex = 0;
    arg.el.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onEventClick(calendarEvent);
      }
    };
  };

  return (
    <div className="mars-calendar academician-calendar overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-2 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={window.matchMedia('(max-width: 767px)').matches ? 'timeGridDay' : 'timeGridWeek'}
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
        height="min(780px, calc(100vh - 12rem))"
        slotDuration="00:10:00"
        slotLabelInterval="01:00:00"
        eventMinHeight={22}
        eventShortHeight={22}
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
