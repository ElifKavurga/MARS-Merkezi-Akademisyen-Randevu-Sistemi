import { useMemo } from 'react';
import StaffCalendarEventCard from './StaffCalendarEventCard';
import StudentEmptyState from './StudentEmptyState';
import {
  CALENDAR_MESSAGES,
  compareCalendarEvents,
  isCalendarAppointment,
} from '../constants/calendar';
import type { CalendarEvent } from '../types/calendar';

type StaffCalendarEventListProps = {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
};

export default function StaffCalendarEventList({
  events,
  onEventClick,
}: StaffCalendarEventListProps) {
  const appointments = useMemo(
    () => [...events].filter(isCalendarAppointment).sort(compareCalendarEvents),
    [events],
  );

  if (appointments.length === 0) {
    return (
      <StudentEmptyState
        icon="event_busy"
        title={CALENDAR_MESSAGES.LIST_EMPTY_TITLE}
        description={CALENDAR_MESSAGES.LIST_EMPTY_DESCRIPTION}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {appointments.map((event) => (
        <StaffCalendarEventCard
          key={`appointment-${event.appointmentId}-${event.slotDate}-${event.startTime}`}
          event={event}
          onOpen={onEventClick}
        />
      ))}
    </div>
  );
}
