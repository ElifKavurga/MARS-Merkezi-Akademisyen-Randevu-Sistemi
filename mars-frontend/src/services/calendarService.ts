import { apiClient } from './apiClient';
import type { CalendarDateRange, CalendarEvent } from '../types/calendar';

export async function getCalendarEvents(
  range: CalendarDateRange,
  includeAppointments = false,
): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get<CalendarEvent[]>('/calendar/events', {
    params: {
      from: range.from,
      to: range.to,
      includeAppointments,
    },
  });
  return data;
}
