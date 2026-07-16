import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import AcademicianCalendar from '../components/AcademicianCalendar';
import CalendarEventDetailModal from '../components/CalendarEventDetailModal';
import Loading from '../components/Loading';
import { FORM_SELECT_CLASS } from '../constants';
import {
  CALENDAR_FILTER_OPTIONS,
  CALENDAR_MESSAGES,
  matchesCalendarFilter,
  toLocalIsoDate,
} from '../constants/calendar';
import { useToast } from '../hooks/useToast';
import { getCalendarEvents } from '../services/calendarService';
import {
  CALENDAR_FILTER,
  type CalendarDateRange,
  type CalendarEvent,
  type CalendarFilter,
} from '../types/calendar';

function initialWeekRange(): CalendarDateRange {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: toLocalIsoDate(monday),
    to: toLocalIsoDate(sunday),
  };
}

export default function AcademicianCalendarPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [range, setRange] = useState<CalendarDateRange>(initialWeekRange);
  const [filter, setFilter] = useState<CalendarFilter>(CALENDAR_FILTER.ALL);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadEvents = useCallback(
    async (nextRange: CalendarDateRange) => {
      setLoading(true);
      try {
        const data = await getCalendarEvents(nextRange);
        setEvents(data);
      } catch (error) {
        if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          toast.error(CALENDAR_MESSAGES.ACCESS_DENIED);
        } else {
          toast.error(CALENDAR_MESSAGES.LOAD_ERROR);
        }
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadEvents(range);
  }, [range, loadEvents]);

  const handleRangeChange = useCallback((nextRange: CalendarDateRange) => {
    setRange((prev) => {
      if (prev.from === nextRange.from && prev.to === nextRange.to) {
        return prev;
      }
      return nextRange;
    });
  }, []);

  const filteredEvents = useMemo(
    () => events.filter((event) => matchesCalendarFilter(event, filter)),
    [events, filter],
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background">{CALENDAR_MESSAGES.TITLE}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {CALENDAR_MESSAGES.SUBTITLE}
          </p>
        </div>
        <label className="flex flex-col gap-1.5 sm:min-w-[200px]">
          <span className="font-label-md text-label-md text-on-surface-variant">Filtre</span>
          <select
            className={FORM_SELECT_CLASS}
            value={filter}
            onChange={(e) => setFilter(e.target.value as CalendarFilter)}
            aria-label="Takvim filtresi"
          >
            {CALENDAR_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative min-h-[420px]">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/70">
            <Loading label="Takvim yükleniyor..." />
          </div>
        ) : null}

        <AcademicianCalendar
          events={filteredEvents}
          onRangeChange={handleRangeChange}
          onEventClick={(event) => {
            setSelectedEvent(event);
            setDetailOpen(true);
          }}
        />

        {!loading && filteredEvents.length === 0 ? (
          <p className="mt-4 font-body-md text-body-md text-on-surface-variant text-center">
            {CALENDAR_MESSAGES.EMPTY_RANGE}
          </p>
        ) : null}
      </div>

      <CalendarEventDetailModal
        open={detailOpen}
        event={selectedEvent}
        onClose={() => {
          setDetailOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
