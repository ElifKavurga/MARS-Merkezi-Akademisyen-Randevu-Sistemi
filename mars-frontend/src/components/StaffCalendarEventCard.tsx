import AppointmentStatusBadge from './AppointmentStatusBadge';
import { getMeetingTypeLabel } from '../constants/appointment';
import {
  formatCalendarTimeRange,
  getMeetingTypeIcon,
} from '../constants/calendar';
import { formatStudentAppointmentDate } from '../utils/studentAppointmentFormat';
import { STUDENT_UI } from '../constants/studentUi';
import type { CalendarEvent } from '../types/calendar';

type StaffCalendarEventCardProps = {
  event: CalendarEvent;
  onOpen: (event: CalendarEvent) => void;
};

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <span
        className="material-symbols-outlined mt-0.5 text-[16px] text-on-surface-variant"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <span className="sr-only">{label}: </span>
        <span className="break-words font-body-md text-[13px] leading-5 text-on-surface">
          {value}
        </span>
      </div>
    </div>
  );
}

/** Appointment-only list card — aligned with student Randevularım design system. */
export default function StaffCalendarEventCard({
  event,
  onOpen,
}: StaffCalendarEventCardProps) {
  const dateLabel = formatStudentAppointmentDate(event.slotDate);
  const timeLabel = formatCalendarTimeRange(event);
  const studentName = event.studentName?.trim() || 'Öğrenci';
  const categoryLabel = event.categoryName?.trim() || '—';

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 transition-colors hover:border-primary-container/40 sm:p-4">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-headline-md text-[16px] leading-5 font-semibold text-on-background">
            {studentName}
          </h3>
          <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
            {categoryLabel}
          </p>
        </div>
        <div className="shrink-0">
          <AppointmentStatusBadge status={event.appointmentStatus ?? ''} />
        </div>
      </div>

      {/* Date & Time Section */}
      <div
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-container/70 px-2.5 py-2"
        aria-label={`Tarih: ${dateLabel}, Saat: ${timeLabel}`}
      >
        <div className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
            event
          </span>
          {dateLabel}
        </div>
        <div className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
            schedule
          </span>
          {timeLabel}
        </div>
      </div>

      {/* Meta details grid */}
      <div className="mt-2.5 grid flex-1 grid-cols-1 content-start gap-1.5 sm:grid-cols-2">
        <MetaRow icon="category" label="Kategori" value={categoryLabel} />
        <MetaRow
          icon={getMeetingTypeIcon(event.meetingType)}
          label="Görüşme Türü"
          value={getMeetingTypeLabel(event.meetingType)}
        />
      </div>

      {/* Detail Button */}
      <div className="mt-3 border-t border-outline-variant/70 pt-3">
        <button
          type="button"
          className={STUDENT_UI.SECONDARY_BUTTON_CLASS}
          onClick={() => onOpen(event)}
        >
          Detay
        </button>
      </div>
    </article>
  );
}
