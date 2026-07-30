import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimeLabel } from '../constants/availability';
import { toLocalIsoDate } from '../constants/calendar';
import type { CalendarEvent } from '../types/calendar';
import {
  DAILY_SCHEDULE_ROW_HEIGHT,
  buildDailyScheduleLayout,
  type DailyScheduleAppointment,
  type DailyScheduleAvailabilityRegion,
} from '../utils/dailySchedule';
import CalendarEventDetailModal from './CalendarEventDetailModal';
import DashboardEmptyState from './DashboardEmptyState';
import Loading from './Loading';

type DashboardDailyScheduleProps = {
  selectedDate: string;
  events: CalendarEvent[];
  loading: boolean;
  error: boolean;
  calendarPath: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onRetry: () => void;
  className?: string;
};

function formatSelectedDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const dateLabel = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(date);
  const normalizedLabel = dateLabel.charAt(0).toLocaleUpperCase('tr-TR') + dateLabel.slice(1);
  return isoDate === toLocalIsoDate(new Date()) ? `Bugün · ${normalizedLabel}` : normalizedLabel;
}

function appointmentClass(status: string | null): string {
  switch (status) {
    case 'APPROVED':
      return 'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200';
    case 'COMPLETED':
      return 'border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200';
    case 'NO_SHOW':
      return 'border-slate-300 bg-slate-200 text-slate-800 hover:bg-slate-300';
    default:
      return 'border-outline-variant bg-surface-container-high text-on-surface hover:bg-surface-container-highest';
  }
}

function AvailabilityRegion({ region }: { region: DailyScheduleAvailabilityRegion }) {
  return (
    <div
      className="pointer-events-none z-[1] m-0.5 overflow-hidden rounded-md bg-primary-fixed/20 px-2 py-1"
      style={{
        gridColumn: 2,
        gridRow: `${region.rowStart} / span ${region.rowSpan}`,
      }}
      aria-hidden="true"
    >
      <p className="truncate font-label-sm text-label-sm text-primary/75">
        Müsait · {region.startLabel} - {region.endLabel}
      </p>
    </div>
  );
}

function AppointmentBlock({
  appointment,
  onClick,
}: {
  appointment: DailyScheduleAppointment;
  onClick: (event: CalendarEvent) => void;
}) {
  const { event, rowStart, rowSpan } = appointment;
  const studentName = event.studentName?.trim() || 'Öğrenci';
  const timeLabel = `${formatTimeLabel(event.startTime)} - ${formatTimeLabel(event.endTime)}`;
  const isCompact = rowSpan <= 2;
  const hasOverlap = appointment.overlapCount > 1;
  const overlapWidth = `${100 / appointment.overlapCount}%`;
  const overlapOffset = `${(appointment.overlapIndex * 100) / appointment.overlapCount}%`;

  return (
    <button
      type="button"
      className={`z-10 m-0.5 min-h-0 min-w-0 overflow-hidden rounded-lg border text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-inset ${isCompact ? 'px-2 py-0.5' : 'px-2.5 py-1.5'} ${appointmentClass(event.appointmentStatus)}`}
      style={{
        gridColumn: 2,
        gridRow: `${rowStart} / span ${rowSpan}`,
        marginLeft: hasOverlap ? `calc(${overlapOffset} + 2px)` : undefined,
        marginRight: hasOverlap ? '2px' : undefined,
        width: hasOverlap ? `calc(${overlapWidth} - 4px)` : undefined,
      }}
      onClick={() => onClick(event)}
      aria-label={`${studentName} randevusu, ${timeLabel}`}
    >
      <div className={`flex h-full min-h-0 overflow-hidden text-left ${isCompact ? 'items-center gap-1' : 'flex-col justify-start gap-0.5'}`}>
        <p
          className={`m-0 min-w-0 truncate font-label-md text-[12px] font-semibold ${isCompact ? 'flex-1 leading-5' : 'w-full leading-4'}`}
          title={studentName}
        >
          {studentName}
        </p>
        {rowSpan >= 2 ? (
          <p className={`m-0 truncate font-label-sm text-[12px] opacity-80 ${isCompact ? 'shrink-0 leading-5' : 'w-full leading-4'}`} title={timeLabel}>
            {timeLabel}
          </p>
        ) : null}
        {rowSpan >= 4 && event.categoryName ? (
          <p
            className="m-0 w-full truncate font-label-sm text-[12px] leading-4 opacity-80"
            title={event.categoryName}
          >
            {event.categoryName}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export default function DashboardDailySchedule({
  selectedDate,
  events,
  loading,
  error,
  calendarPath,
  onPreviousDay,
  onNextDay,
  onToday,
  onRetry,
  className = '',
}: DashboardDailyScheduleProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => buildDailyScheduleLayout(events), [events]);
  const dateLabel = formatSelectedDate(selectedDate);

  useEffect(() => {
    if (!layout || selectedDate !== toLocalIsoDate(new Date())) {
      return;
    }
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (currentMinutes < layout.startMinutes || currentMinutes >= layout.endMinutes) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }
      const currentOffset =
        ((currentMinutes - layout.startMinutes) / 10) * DAILY_SCHEDULE_ROW_HEIGHT;
      container.scrollTop = Math.max(0, currentOffset - container.clientHeight / 3);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [layout, selectedDate]);

  return (
    <div className={`min-w-0 ${className}`}>
      <section className="min-w-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex flex-col gap-3 border-b border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <h2 className="font-headline-md text-headline-md text-primary">Bugünün Programı</h2>
            <p className="mt-1 truncate font-body-sm text-body-sm text-on-surface-variant">
              {dateLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface text-primary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
              onClick={onPreviousDay}
              aria-label="Önceki gün"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                chevron_left
              </span>
            </button>
            <button
              type="button"
              className="h-8 rounded-lg border border-outline-variant bg-surface px-3 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
              onClick={onToday}
            >
              Bugün
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface text-primary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
              onClick={onNextDay}
              aria-label="Sonraki gün"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                chevron_right
              </span>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loading label="Günlük program yükleniyor..." />
            </div>
          ) : error ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg bg-error-container/40 p-5 text-center">
              <p className="font-body-md text-body-md text-on-error-container" role="alert">
                Günlük program yüklenemedi.
              </p>
              <button
                type="button"
                className="rounded-lg bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary"
                onClick={onRetry}
              >
                Tekrar Dene
              </button>
            </div>
          ) : !layout ? (
            <DashboardEmptyState
              icon="event_available"
              message="Bugün için tanımlı bir program bulunmuyor."
            />
          ) : (
            <div
              ref={scrollContainerRef}
              className="dashboard-daily-schedule-scroll max-h-80 overflow-y-auto overscroll-contain rounded-lg border border-outline-variant bg-surface sm:max-h-96"
              aria-label={`${dateLabel} günlük programı`}
            >
              <div
                className="relative grid min-w-0"
                style={{
                  gridTemplateColumns: 'clamp(2.75rem, 9vw, 3.75rem) minmax(0, 1fr)',
                  gridTemplateRows: `repeat(${layout.slots.length}, ${DAILY_SCHEDULE_ROW_HEIGHT}px)`,
                }}
              >
                {layout.slots.map((slot, index) => (
                  <div key={slot.minutes} className="contents">
                    <div
                      className="border-r border-t border-outline-variant/40 px-1 pt-1 text-center font-label-sm text-label-sm text-on-surface-variant"
                      style={{ gridColumn: 1, gridRow: index + 1 }}
                    >
                      {slot.label}
                    </div>
                    <div
                      className="min-w-0 border-t border-outline-variant/30"
                      style={{ gridColumn: 2, gridRow: index + 1 }}
                    />
                  </div>
                ))}
                {layout.availabilityRegions.map((region) => (
                  <AvailabilityRegion
                    key={`${region.startLabel}-${region.endLabel}-${region.rowStart}`}
                    region={region}
                  />
                ))}
                {layout.appointments.map((appointment) => (
                  <AppointmentBlock
                    key={appointment.event.appointmentId}
                    appointment={appointment}
                    onClick={setSelectedEvent}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-outline-variant px-4 py-3 sm:px-5">
          <Link
            to={calendarPath}
            className="inline-flex items-center gap-1 rounded font-label-md text-label-md text-primary no-underline hover:no-underline focus:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
            style={{ textDecoration: 'none' }}
          >
            Takvimin Tamamını Gör
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
      </section>

      <CalendarEventDetailModal
        open={selectedEvent !== null}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
