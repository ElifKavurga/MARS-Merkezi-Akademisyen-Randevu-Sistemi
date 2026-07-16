import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import CourseDetailField from './CourseDetailField';
import AvailabilityStatusBadge from './AvailabilityStatusBadge';
import {
  CALENDAR_MESSAGES,
  formatCalendarDateLabel,
} from '../constants/calendar';
import { formatTimeLabel } from '../constants/availability';
import type { CalendarEvent } from '../types/calendar';

type CalendarEventDetailModalProps = {
  open: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
};

export default function CalendarEventDetailModal({
  open,
  event,
  onClose,
}: CalendarEventDetailModalProps) {
  if (!event) {
    return null;
  }

  const isRecurring = event.recurrenceRuleId != null;

  return (
    <ModalShell
      open={open}
      titleId="calendar-event-detail-title"
      onClose={onClose}
      maxWidthClass="sm:max-w-md"
      footer={
        <div className="bg-surface-bright px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-outline-variant">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md text-on-primary hover:bg-black sm:w-auto shadow-sm transition-colors"
            onClick={onClose}
          >
            {CALENDAR_MESSAGES.CLOSE}
          </button>
        </div>
      }
    >
      <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <ModalHeader
          titleId="calendar-event-detail-title"
          icon="event"
          title={CALENDAR_MESSAGES.DETAIL_TITLE}
          description={CALENDAR_MESSAGES.DETAIL_DESCRIPTION}
        />
        <div className="mt-2">
          <CourseDetailField label="Tarih">{formatCalendarDateLabel(event.slotDate)}</CourseDetailField>
          <CourseDetailField label="Başlangıç Saati">
            {formatTimeLabel(event.startTime)}
          </CourseDetailField>
          <CourseDetailField label="Bitiş Saati">{formatTimeLabel(event.endTime)}</CourseDetailField>
          <CourseDetailField label="Tekrarlayan mı?">{isRecurring ? 'Evet' : 'Hayır'}</CourseDetailField>
          <CourseDetailField label="Durum">
            <AvailabilityStatusBadge isBlocked={event.isBlocked} />
          </CourseDetailField>
        </div>
      </div>
    </ModalShell>
  );
}
