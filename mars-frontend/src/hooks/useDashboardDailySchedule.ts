import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toLocalIsoDate } from '../constants/calendar';
import { getCalendarEvents } from '../services/calendarService';
import { useAuth } from './useAuth';

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
}

export function useDashboardDailySchedule() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => toLocalIsoDate(new Date()));
  const query = useQuery({
    queryKey: ['dashboard-daily-schedule', user?.userId, selectedDate],
    queryFn: () =>
      getCalendarEvents(
        {
          from: selectedDate,
          to: selectedDate,
        },
        true,
      ),
    enabled: user != null,
  });

  const showPreviousDay = useCallback(() => {
    setSelectedDate((current) => addDays(current, -1));
  }, []);
  const showNextDay = useCallback(() => {
    setSelectedDate((current) => addDays(current, 1));
  }, []);
  const showToday = useCallback(() => {
    setSelectedDate(toLocalIsoDate(new Date()));
  }, []);

  return {
    selectedDate,
    events: query.data ?? [],
    loading: query.isPending,
    error: query.isError,
    retry: query.refetch,
    showPreviousDay,
    showNextDay,
    showToday,
  };
}
