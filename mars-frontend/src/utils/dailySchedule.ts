import type { CalendarEvent } from '../types/calendar';

export const DAILY_SCHEDULE_SLOT_MINUTES = 10;
export const DAILY_SCHEDULE_ROW_HEIGHT = 32;

export type DailyScheduleAppointment = {
  event: CalendarEvent;
  rowStart: number;
  rowSpan: number;
  overlapIndex: number;
  overlapCount: number;
};

export type DailyScheduleAvailabilityRegion = {
  rowStart: number;
  rowSpan: number;
  startLabel: string;
  endLabel: string;
};

export type DailyScheduleSlot = {
  minutes: number;
  label: string;
  isAvailable: boolean;
};

export type DailyScheduleLayout = {
  startMinutes: number;
  endMinutes: number;
  slots: DailyScheduleSlot[];
  availabilityRegions: DailyScheduleAvailabilityRegion[];
  appointments: DailyScheduleAppointment[];
};

function timeToMinutes(time: string): number | null {
  const [hoursText, minutesText] = time.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (
    !Number.isInteger(hours)
    || !Number.isInteger(minutes)
    || hours < 0
    || hours > 23
    || minutes < 0
    || minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

function getEventRange(event: CalendarEvent): { start: number; end: number } | null {
  const start = timeToMinutes(event.startTime);
  const end = timeToMinutes(event.endTime);
  if (start == null || end == null || end <= start) {
    return null;
  }
  return { start, end };
}

function isScheduleAppointment(status: string | null): boolean {
  return status === 'APPROVED' || status === 'COMPLETED' || status === 'NO_SHOW';
}

function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (ranges.length === 0) {
    return [];
  }

  const sorted = [...ranges].sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: Array<{ start: number; end: number }> = [{ ...sorted[0] }];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

type PositionedDailyScheduleAppointment = DailyScheduleAppointment & {
  start: number;
  end: number;
};

function assignAppointmentColumns(
  appointments: PositionedDailyScheduleAppointment[],
): DailyScheduleAppointment[] {
  if (appointments.length === 0) {
    return [];
  }

  const sorted = [...appointments].sort(
    (left, right) => left.start - right.start || left.end - right.end,
  );
  const groups: PositionedDailyScheduleAppointment[][] = [];
  let currentGroup: PositionedDailyScheduleAppointment[] = [];
  let currentGroupEnd = -1;

  sorted.forEach((appointment) => {
    if (currentGroup.length === 0 || appointment.start < currentGroupEnd) {
      currentGroup.push(appointment);
      currentGroupEnd = Math.max(currentGroupEnd, appointment.end);
      return;
    }

    groups.push(currentGroup);
    currentGroup = [appointment];
    currentGroupEnd = appointment.end;
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups
    .flatMap((group) => {
      const columnEnds: number[] = [];
      const placed = group.map((appointment) => {
        const availableColumn = columnEnds.findIndex((end) => end <= appointment.start);
        const columnIndex = availableColumn === -1 ? columnEnds.length : availableColumn;
        columnEnds[columnIndex] = appointment.end;
        return {
          ...appointment,
          overlapIndex: columnIndex,
        };
      });
      const overlapCount = Math.max(1, columnEnds.length);
      return placed.map(({ start, end, ...appointment }) => ({
        ...appointment,
        overlapCount,
      }));
    })
    .sort((left, right) => left.rowStart - right.rowStart || left.overlapIndex - right.overlapIndex);
}

export function buildDailyScheduleLayout(events: CalendarEvent[]): DailyScheduleLayout | null {
  const availabilityEvents = events.filter(
    (event) =>
      event.eventType === 'AVAILABILITY'
      && !event.isBlocked
      && getEventRange(event) !== null,
  );
  const appointmentEvents = events.filter(
    (event) =>
      event.eventType === 'APPOINTMENT'
      && isScheduleAppointment(event.appointmentStatus)
      && getEventRange(event) !== null,
  );
  const visibleEvents = [...availabilityEvents, ...appointmentEvents];

  if (visibleEvents.length === 0) {
    return null;
  }

  const ranges = visibleEvents
    .map(getEventRange)
    .filter((range): range is { start: number; end: number } => range !== null);
  const startMinutes = Math.max(
    0,
    Math.floor(Math.min(...ranges.map((range) => range.start)) / DAILY_SCHEDULE_SLOT_MINUTES)
      * DAILY_SCHEDULE_SLOT_MINUTES,
  );
  const endMinutes = Math.min(
    24 * 60,
    Math.ceil(Math.max(...ranges.map((range) => range.end)) / DAILY_SCHEDULE_SLOT_MINUTES)
      * DAILY_SCHEDULE_SLOT_MINUTES,
  );

  const slots: DailyScheduleSlot[] = [];
  for (
    let minutes = startMinutes;
    minutes < endMinutes;
    minutes += DAILY_SCHEDULE_SLOT_MINUTES
  ) {
    const slotEnd = minutes + DAILY_SCHEDULE_SLOT_MINUTES;
    const isAvailable = availabilityEvents.some((event) => {
      const range = getEventRange(event);
      return range !== null && range.start <= minutes && range.end >= slotEnd;
    });
    slots.push({
      minutes,
      label: formatMinutes(minutes),
      isAvailable,
    });
  }

  const availabilityRegions = mergeRanges(
    availabilityEvents
      .map(getEventRange)
      .filter((range): range is { start: number; end: number } => range !== null),
  ).map((range) => {
    const clippedStart = Math.max(range.start, startMinutes);
    const clippedEnd = Math.min(range.end, endMinutes);
    return {
      rowStart: Math.floor((clippedStart - startMinutes) / DAILY_SCHEDULE_SLOT_MINUTES) + 1,
      rowSpan: Math.max(
        1,
        Math.ceil((clippedEnd - clippedStart) / DAILY_SCHEDULE_SLOT_MINUTES),
      ),
      startLabel: formatMinutes(clippedStart),
      endLabel: formatMinutes(clippedEnd),
    };
  });

  const appointments = assignAppointmentColumns(appointmentEvents
    .map((event): PositionedDailyScheduleAppointment | null => {
      const range = getEventRange(event);
      if (!range) {
        return null;
      }
      const clippedStart = Math.max(range.start, startMinutes);
      const clippedEnd = Math.min(range.end, endMinutes);
      const rowStart =
        Math.floor((clippedStart - startMinutes) / DAILY_SCHEDULE_SLOT_MINUTES) + 1;
      const rowSpan = Math.max(
        1,
        Math.ceil((clippedEnd - clippedStart) / DAILY_SCHEDULE_SLOT_MINUTES),
      );
      return {
        event,
        rowStart,
        rowSpan,
        start: clippedStart,
        end: clippedEnd,
        overlapIndex: 0,
        overlapCount: 1,
      };
    })
    .filter((appointment): appointment is PositionedDailyScheduleAppointment => appointment !== null));

  return {
    startMinutes,
    endMinutes,
    slots,
    availabilityRegions,
    appointments,
  };
}
