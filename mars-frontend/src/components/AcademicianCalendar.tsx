import { useMemo } from 'react';
import {
  formatCalendarEventTooltip,
  getCalendarEventStyle,
} from '../constants/calendar';
import type { CalendarDateRange, CalendarEvent } from '../types/calendar';

type AcademicianCalendarProps = {
  events: CalendarEvent[];
  initialDate?: string;
  onRangeChange: (range: CalendarDateRange) => void;
  onEventClick: (event: CalendarEvent) => void;
};

const START_HOUR = 8;
const END_HOUR = 17;
const HOUR_COUNT = END_HOUR - START_HOUR;
const HOUR_MARKERS = Array.from({ length: HOUR_COUNT + 1 }, (_, index) => START_HOUR + index);

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
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

function overlapsVisibleHours(event: CalendarEvent): boolean {
  const dayStart = START_HOUR * 60;
  const dayEnd = END_HOUR * 60;
  return parseTimeToMinutes(event.startTime) < dayEnd
    && parseTimeToMinutes(event.endTime) > dayStart;
}

function shouldRenderCalendarEvent(event: CalendarEvent): boolean {
  if (event.eventType !== 'APPOINTMENT') {
    return true;
  }
  return event.appointmentStatus !== 'REJECTED'
    && event.appointmentStatus !== 'CANCELLED'
    && event.appointmentStatus !== 'CANCELLED_BY_STUDENT'
    && event.appointmentStatus !== 'CANCELLED_BY_ACADEMICIAN';
}

function getEventPosition(event: CalendarEvent) {
  const dayStart = START_HOUR * 60;
  const dayEnd = END_HOUR * 60;
  const start = Math.max(dayStart, parseTimeToMinutes(event.startTime));
  const end = Math.min(dayEnd, parseTimeToMinutes(event.endTime));
  const total = dayEnd - dayStart;
  const left = ((start - dayStart) / total) * 100;
  const width = (Math.max(end - start, 20) / total) * 100;
  return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
}

function CalendarEventChip({
  event,
  stackIndex,
  onOpen,
}: {
  event: CalendarEvent;
  stackIndex: number;
  onOpen: (event: CalendarEvent) => void;
}) {
  const style = getCalendarEventStyle(event);
  const position = getEventPosition(event);
  const tooltip = formatCalendarEventTooltip(event);

  if (event.eventType === 'AVAILABILITY') {
    return (
      <div
        className="absolute top-1/2 h-[1.35rem] -translate-y-1/2 rounded border opacity-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,.35)]"
        style={{
          ...position,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
        }}
        title={tooltip}
      />
    );
  }

  return (
    <button
      type="button"
      className="absolute flex h-[1.55rem] min-w-[5.5rem] items-center overflow-hidden rounded-md border px-2 text-left text-[11px] font-semibold leading-none text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
      style={{
        ...position,
        top: `${0.35 + stackIndex * 1.8}rem`,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        color: style.textColor,
      }}
      title={tooltip}
      aria-label={tooltip.replaceAll('\n', ', ')}
      onClick={() => onOpen(event)}
    >
      <span className="truncate">{event.studentName?.trim() || 'Öğrenci'}</span>
    </button>
  );
}

export default function AcademicianCalendar({
  events,
  initialDate,
  onRangeChange: _onRangeChange,
  onEventClick,
}: AcademicianCalendarProps) {
  const days = useMemo(
    () => Array.from(
      { length: 5 },
      (_, index) => addDays(initialDate ?? new Date().toISOString().slice(0, 10), index),
    ),
    [initialDate],
  );

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    for (const event of mergeAdjacentAvailability(events)) {
      if (event.isBlocked || !overlapsVisibleHours(event) || !shouldRenderCalendarEvent(event)) continue;
      const dayEvents = grouped.get(event.slotDate) ?? [];
      dayEvents.push(event);
      grouped.set(event.slotDate, dayEvents);
    }

    for (const dayEvents of grouped.values()) {
      dayEvents.sort((left, right) => {
        const byStart = left.startTime.localeCompare(right.startTime);
        if (byStart !== 0) return byStart;
        return left.eventType.localeCompare(right.eventType);
      });
    }

    return grouped;
  }, [events]);

  return (
    <div className="mars-calendar academician-calendar overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-1.5 sm:p-2">
      <div className="grid overflow-hidden rounded-md border border-outline-variant/70 bg-surface">
        <div className="grid grid-cols-[6.5rem_1fr] border-b border-outline-variant/70 bg-surface-container-lowest text-label-sm font-semibold text-on-surface-variant">
          <div className="border-r border-outline-variant/70 px-2 py-2">Tarih</div>
          <div className="relative h-9 border-r border-outline-variant/40">
            {HOUR_MARKERS.map((hour, index) => (
              <span
                key={hour}
                className={`absolute top-1/2 -translate-y-1/2 px-1 ${
                  index === 0 || index === HOUR_COUNT ? '' : '-translate-x-1/2'
                }`}
                style={
                  index === 0
                    ? { left: 0 }
                    : index === HOUR_COUNT
                      ? { right: 0 }
                      : { left: `${(index / HOUR_COUNT) * 100}%` }
                }
              >
                {formatHour(hour)}
              </span>
            ))}
          </div>
        </div>

        <div>
          {days.map((day, dayIndex) => {
            const dayEvents = eventsByDate.get(day) ?? [];
            const availabilityEvents = dayEvents.filter((event) => event.eventType === 'AVAILABILITY');
            const appointmentEvents = dayEvents.filter((event) => event.eventType === 'APPOINTMENT');
            const rowMinHeight = `${Math.max(4.25, appointmentEvents.length * 1.8 + 0.9)}rem`;

            return (
              <div
                key={day}
                className="grid min-h-[4.25rem] grid-cols-[6.5rem_1fr] border-b border-outline last:border-b-0"
                style={{ minHeight: rowMinHeight }}
              >
                <div
                  className={`flex items-center border-r border-outline-variant px-2 font-label-sm text-label-sm font-semibold text-on-surface ${
                    dayIndex % 2 === 0 ? 'bg-surface-container' : 'bg-surface-container-lowest'
                  }`}
                >
                  {formatDayLabel(day)}
                </div>
                <div
                  className={`relative min-w-0 bg-[linear-gradient(to_right,rgba(198,197,208,.55)_1px,transparent_1px)] bg-[length:calc(100%/9)_100%] ${
                    dayIndex % 2 === 0 ? 'bg-[#f0f4fb]' : 'bg-surface-container-lowest'
                  }`}
                >
                  {availabilityEvents.map((event) => (
                    <CalendarEventChip
                      key={`${event.eventType}-${event.slotId}-${event.slotDate}-${event.startTime}`}
                      event={event}
                      stackIndex={0}
                      onOpen={onEventClick}
                    />
                  ))}
                  {appointmentEvents.map((event, index) => (
                    <CalendarEventChip
                      key={`${event.eventType}-${event.appointmentId ?? event.slotId}-${event.slotDate}-${event.startTime}`}
                      event={event}
                      stackIndex={index}
                      onOpen={onEventClick}
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
