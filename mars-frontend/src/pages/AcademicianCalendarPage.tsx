import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import AcademicianCalendar from '../components/AcademicianCalendar';
import CalendarEventDetailModal from '../components/CalendarEventDetailModal';
import Loading from '../components/Loading';
import StaffCalendarEventList from '../components/StaffCalendarEventList';
import StudentSegmentedTabs from '../components/StudentSegmentedTabs';
import {
  CALENDAR_EVENT_COLORS,
  CALENDAR_FILTER_OPTIONS,
  CALENDAR_MESSAGES,
  STAFF_CALENDAR_FILTER_OPTIONS,
  isCalendarAppointment,
  matchesCalendarFilter,
  shiftCalendarRange,
  toLocalIsoDate,
} from '../constants/calendar';
import { STUDENT_UI } from '../constants/studentUi';
import { useToast } from '../hooks/useToast';
import { getCalendarEvents } from '../services/calendarService';
import {
  CALENDAR_FILTER,
  type CalendarDateRange,
  type CalendarEvent,
  type CalendarFilter,
} from '../types/calendar';

type CalendarViewMode = 'list' | 'calendar';

const VIEW_OPTIONS = [
  { value: 'list' as const, label: CALENDAR_MESSAGES.VIEW_LIST },
  { value: 'calendar' as const, label: CALENDAR_MESSAGES.VIEW_CALENDAR },
];

const APPOINTMENT_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tüm Randevular' },
  { value: 'PENDING', label: 'Bekleyenler' },
  { value: 'APPROVED', label: 'Onaylananlar' },
  { value: 'REJECTED', label: 'Reddedilenler' },
  { value: 'COMPLETED', label: 'Tamamlananlar' },
  { value: 'CANCELLED_OR_OTHER', label: 'İptal / Diğer' },
] as const;

function initialWeekRange(): CalendarDateRange {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return {
    from: toLocalIsoDate(monday),
    to: toLocalIsoDate(friday),
  };
}

function formatCompactRangeLabel(range: CalendarDateRange): string {
  const format = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
    });
  };
  const year = new Date(`${range.to}T00:00:00`).getFullYear();
  return `${format(range.from)} - ${format(range.to)} ${year}`;
}

type AcademicianCalendarPageProps = {
  includeAppointments?: boolean;
  title?: string;
  subtitle?: string;
};

export default function AcademicianCalendarPage({
  includeAppointments = false,
  title = CALENDAR_MESSAGES.TITLE,
  subtitle: _subtitle = CALENDAR_MESSAGES.SUBTITLE,
}: AcademicianCalendarPageProps = {}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [range, setRange] = useState<CalendarDateRange>(initialWeekRange);
  const [filter, setFilter] = useState<CalendarFilter>(CALENDAR_FILTER.ALL);
  const [appointmentFilter, setAppointmentFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<CalendarViewMode>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadEvents = useCallback(
    async (nextRange: CalendarDateRange) => {
      setLoading(true);
      try {
        const data = await getCalendarEvents(nextRange, includeAppointments);
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
    [includeAppointments, toast],
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

  const listAppointments = useMemo(() => {
    const rawAppointments = events.filter(isCalendarAppointment);
    if (appointmentFilter === 'ALL') {
      return rawAppointments;
    }
    if (appointmentFilter === 'CANCELLED_OR_OTHER') {
      return rawAppointments.filter(
        (app) => app.appointmentStatus === 'CANCELLED' || app.appointmentStatus === 'NO_SHOW',
      );
    }
    return rawAppointments.filter((app) => app.appointmentStatus === appointmentFilter);
  }, [events, appointmentFilter]);

  const openEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 lg:h-[calc(100vh-6.25rem)] lg:overflow-hidden">
      <div className="grid gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 shadow-sm lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="mr-1 font-title-md text-title-md text-on-background">{title}</h1>
          <StudentSegmentedTabs
            value={viewMode}
            options={VIEW_OPTIONS}
            ariaLabel={CALENDAR_MESSAGES.VIEW_MODE_LABEL}
            onChange={setViewMode}
          />
          {includeAppointments && viewMode === 'calendar' ? (
            <LegendItem
              color={CALENDAR_EVENT_COLORS.NORMAL_SOFT}
              borderColor={CALENDAR_EVENT_COLORS.NORMAL}
              label="Müsaitlik"
            />
          ) : null}
        </div>

        <div className="flex min-w-0 items-center justify-center gap-2">
          <button
            type="button"
            className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} h-9 px-3 py-1.5`}
            aria-label={CALENDAR_MESSAGES.RANGE_PREV}
            onClick={() => handleRangeChange(shiftCalendarRange(range, -7))}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              chevron_left
            </span>
          </button>
          <p className="min-w-[9.5rem] text-center font-label-md text-label-md text-on-surface">
            <span className="sr-only">{CALENDAR_MESSAGES.RANGE_LABEL}: </span>
            {formatCompactRangeLabel(range)}
          </p>
          <button
            type="button"
            className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} h-9 px-3 py-1.5`}
            aria-label={CALENDAR_MESSAGES.RANGE_NEXT}
            onClick={() => handleRangeChange(shiftCalendarRange(range, 7))}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              chevron_right
            </span>
          </button>
        </div>

        <div className="flex min-w-0 justify-end">
          <label className="flex min-w-0 items-center gap-2 lg:w-[220px]">
            <span className="shrink-0 font-label-md text-label-md text-on-surface-variant">Filtre</span>
            {viewMode === 'calendar' ? (
              <select
                className={`${STUDENT_UI.FILTER_CONTROL_CLASS} h-10`}
                value={filter}
                onChange={(e) => setFilter(e.target.value as CalendarFilter)}
                aria-label="Takvim filtresi"
              >
                {(includeAppointments
                  ? STAFF_CALENDAR_FILTER_OPTIONS
                  : CALENDAR_FILTER_OPTIONS
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className={`${STUDENT_UI.FILTER_CONTROL_CLASS} h-10`}
                value={appointmentFilter}
                onChange={(e) => setAppointmentFilter(e.target.value)}
                aria-label="Randevu filtresi"
              >
                {APPOINTMENT_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>
      </div>

      <div className="relative">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/70">
            <Loading label="Takvim yükleniyor..." />
          </div>
        ) : null}

        {viewMode === 'calendar' ? (
          <AcademicianCalendar
            initialDate={range.from}
            events={filteredEvents}
            onRangeChange={handleRangeChange}
            onEventClick={openEvent}
          />
        ) : (
          <StaffCalendarEventList
            events={listAppointments}
            onEventClick={openEvent}
          />
        )}
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

function LegendItem({
  color,
  borderColor,
  label,
  dashed = false,
}: {
  color: string;
  borderColor: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
      <span
        className="h-3 w-3 rounded-sm"
        style={{
          backgroundColor: color,
          border: `1px ${dashed ? 'dashed' : 'solid'} ${borderColor}`,
        }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
