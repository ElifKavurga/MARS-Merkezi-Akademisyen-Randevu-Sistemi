import type { ReactNode } from 'react';
import ModalShell from './ModalShell';
import AvailabilityStatusBadge from './AvailabilityStatusBadge';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import {
  CALENDAR_MESSAGES,
  formatCalendarDateLabel,
  getMeetingTypeIcon,
} from '../constants/calendar';
import { formatTimeLabel } from '../constants/availability';
import { getMeetingTypeLabel } from '../constants/appointment';
import { STUDENT_UI } from '../constants/studentUi';
import type { CalendarEvent } from '../types/calendar';

type CalendarEventDetailModalProps = {
  open: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
};

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: ReactNode;
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
        <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        <div className="mt-0.5 break-words font-body-md text-[13px] leading-5 text-on-surface">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function CalendarEventDetailModal({
  open,
  event,
  onClose,
}: CalendarEventDetailModalProps) {
  if (!event) {
    return null;
  }

  const isRecurring = event.recurrenceRuleId != null;
  const isAppointment = event.eventType === 'APPOINTMENT';
  const timeLabel = `${formatTimeLabel(event.startTime)} – ${formatTimeLabel(event.endTime)}`;
  const courseLabel = event.courseName
    ? `${event.courseCode ?? ''} ${event.courseName}`.trim()
    : null;

  return (
    <ModalShell
      open={open}
      titleId="calendar-event-detail-title"
      onClose={onClose}
      maxWidthClass="sm:max-w-md"
      footer={
        <div className="flex justify-end border-t border-outline-variant bg-surface-bright px-4 py-3 sm:px-5">
          <button
            type="button"
            className={STUDENT_UI.PRIMARY_BUTTON_CLASS}
            onClick={onClose}
          >
            {CALENDAR_MESSAGES.CLOSE}
          </button>
        </div>
      }
    >
      <div className="bg-surface px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="font-headline-md text-[16px] leading-5 font-semibold text-on-background"
              id="calendar-event-detail-title"
            >
              {isAppointment
                ? CALENDAR_MESSAGES.APPOINTMENT_DETAIL_TITLE
                : CALENDAR_MESSAGES.DETAIL_TITLE}
            </h3>
            <p className="mt-1 font-body-md text-[13px] text-on-surface-variant">
              {isAppointment
                ? CALENDAR_MESSAGES.APPOINTMENT_DETAIL_DESCRIPTION
                : CALENDAR_MESSAGES.DETAIL_DESCRIPTION}
            </p>
          </div>
          {isAppointment ? (
            <AppointmentStatusBadge status={event.appointmentStatus ?? ''} />
          ) : (
            <AvailabilityStatusBadge isBlocked={Boolean(event.isBlocked)} />
          )}
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5">
          <div
            className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-container/70 px-2.5 py-2"
            aria-label={`Tarih: ${formatCalendarDateLabel(event.slotDate)}, Saat: ${timeLabel}`}
          >
            <div className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
                event
              </span>
              {formatCalendarDateLabel(event.slotDate)}
            </div>
            <div className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
                schedule
              </span>
              {timeLabel}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {isAppointment ? (
              <>
                <MetaRow
                  icon="person"
                  label="Öğrenci"
                  value={event.studentName?.trim() || '—'}
                />
                <MetaRow
                  icon={getMeetingTypeIcon(event.meetingType)}
                  label="Görüşme Türü"
                  value={getMeetingTypeLabel(event.meetingType)}
                />
                <MetaRow
                  icon="category"
                  label="Kategori"
                  value={event.categoryName?.trim() || '—'}
                />
                {courseLabel ? (
                  <MetaRow icon="menu_book" label="Ders" value={courseLabel} />
                ) : null}
              </>
            ) : (
              <>
                <MetaRow
                  icon={getMeetingTypeIcon(event.meetingType)}
                  label="Görüşme Türü"
                  value={getMeetingTypeLabel(event.meetingType)}
                />
                <MetaRow
                  icon="repeat"
                  label="Tekrarlayan mı?"
                  value={isRecurring ? 'Evet' : 'Hayır'}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
