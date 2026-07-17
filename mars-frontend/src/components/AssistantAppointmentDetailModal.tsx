import {
  ASSISTANT_APPOINTMENT_MESSAGES,
  getMeetingTypeLabel,
} from '../constants/appointment';
import type { AssistantAppointment } from '../types/appointment';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import ModalShell from './ModalShell';

type AssistantAppointmentDetailModalProps = {
  appointment: AssistantAppointment | null;
  onClose: () => void;
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export default function AssistantAppointmentDetailModal({
  appointment,
  onClose,
}: AssistantAppointmentDetailModalProps) {
  return (
    <ModalShell
      open={appointment !== null}
      titleId="assistant-appointment-detail-title"
      maxWidthClass="sm:max-w-xl"
      onClose={onClose}
      footer={
        <div className="flex justify-end border-t border-outline-variant bg-surface-bright px-6 py-4">
          <button
            type="button"
            className="rounded-lg border border-outline-variant bg-surface px-5 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container"
            onClick={onClose}
          >
            Kapat
          </button>
        </div>
      }
    >
      {appointment ? (
        <div className="bg-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="assistant-appointment-detail-title"
                className="font-headline-md text-headline-md text-on-background"
              >
                {ASSISTANT_APPOINTMENT_MESSAGES.DETAIL_TITLE}
              </h2>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Randevu #{appointment.appointmentId}
              </p>
            </div>
            <AppointmentStatusBadge status={appointment.appointmentStatus} />
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Öğrenci" value={appointment.studentName} />
            <DetailItem label="Tarih" value={formatDate(appointment.appointmentDate)} />
            <DetailItem
              label="Saat"
              value={`${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`}
            />
            <DetailItem label="Kategori" value={appointment.categoryName} />
            <DetailItem
              label="Ders"
              value={
                appointment.courseName
                  ? `${appointment.courseCode ?? ''} ${appointment.courseName}`.trim()
                  : '-'
              }
            />
            <DetailItem
              label="Görüşme Türü"
              value={getMeetingTypeLabel(appointment.meetingType)}
            />
          </dl>
        </div>
      ) : null}
    </ModalShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <dt className="font-label-sm text-label-sm text-on-surface-variant">{label}</dt>
      <dd className="mt-1 font-body-md text-body-md font-medium text-on-background">{value}</dd>
    </div>
  );
}
