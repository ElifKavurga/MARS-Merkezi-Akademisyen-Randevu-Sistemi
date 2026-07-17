import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import CourseDetailField from './CourseDetailField';
import AvailabilityStatusBadge from './AvailabilityStatusBadge';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import {
  CALENDAR_MESSAGES,
  formatCalendarDateLabel,
} from '../constants/calendar';
import { formatTimeLabel } from '../constants/availability';
import { getMeetingTypeLabel } from '../constants/appointment';
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
  const isAppointment = event.eventType === 'APPOINTMENT';

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
          title={isAppointment ? 'Randevu Detayı' : CALENDAR_MESSAGES.DETAIL_TITLE}
          description={CALENDAR_MESSAGES.DETAIL_DESCRIPTION}
        />
        <div className="mt-2">
          {isAppointment ? (
            <CourseDetailField label="Öğrenci">{event.studentName ?? '-'}</CourseDetailField>
          ) : null}
          <CourseDetailField label="Tarih">{formatCalendarDateLabel(event.slotDate)}</CourseDetailField>
          <CourseDetailField label="Saat">
            {formatTimeLabel(event.startTime)} - {formatTimeLabel(event.endTime)}
          </CourseDetailField>
          {isAppointment ? (
            <>
              <CourseDetailField label="Kategori">{event.categoryName ?? '-'}</CourseDetailField>
              <CourseDetailField label="Ders">
                {event.courseName
                  ? `${event.courseCode ?? ''} ${event.courseName}`.trim()
                  : '-'}
              </CourseDetailField>
              <CourseDetailField label="Görüşme Türü">
                {getMeetingTypeLabel(event.meetingType)}
              </CourseDetailField>
              <CourseDetailField label="Durum">
                <AppointmentStatusBadge status={event.appointmentStatus ?? ''} />
              </CourseDetailField>
            </>
          ) : (
            <>
              <CourseDetailField label="Görüşme Türü">
                {getMeetingTypeLabel(event.meetingType)}
              </CourseDetailField>
              <CourseDetailField label="Tekrarlayan mı?">
                {isRecurring ? 'Evet' : 'Hayır'}
              </CourseDetailField>
              <CourseDetailField label="Durum">
                <AvailabilityStatusBadge isBlocked={Boolean(event.isBlocked)} />
              </CourseDetailField>
            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
