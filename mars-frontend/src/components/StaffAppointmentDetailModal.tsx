import {
  STAFF_APPOINTMENT_MESSAGES,
  getMeetingTypeLabel,
} from '../constants/appointment';
import { DELEGATION_MESSAGES } from '../constants/delegation';
import { STUDENT_UI } from '../constants/studentUi';
import type { StaffAppointment } from '../types/appointment';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import ModalShell from './ModalShell';

type StaffAppointmentDetailModalProps = {
  appointment: StaffAppointment | null;
  actionDisabled?: boolean;
  canDecide?: boolean;
  canDelegate?: boolean;
  onApprove: (appointment: StaffAppointment) => void;
  onReject: (appointment: StaffAppointment) => void;
  onDelegate?: (appointment: StaffAppointment) => void;
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

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
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

export default function StaffAppointmentDetailModal({
  appointment,
  actionDisabled = false,
  canDecide = false,
  canDelegate = false,
  onApprove,
  onReject,
  onDelegate,
  onClose,
}: StaffAppointmentDetailModalProps) {
  const dateLabel = appointment ? formatDate(appointment.appointmentDate) : '';
  const timeLabel = appointment
    ? `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`
    : '';

  return (
    <ModalShell
      open={appointment !== null}
      titleId="staff-appointment-detail-title"
      maxWidthClass="sm:max-w-md"
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 border-t border-outline-variant bg-surface-bright px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={STUDENT_UI.SECONDARY_BUTTON_CLASS}
            onClick={onClose}
          >
            Kapat
          </button>
          {canDelegate && appointment && onDelegate ? (
            <button
              type="button"
              className={STUDENT_UI.SECONDARY_BUTTON_CLASS}
              disabled={actionDisabled}
              onClick={() => onDelegate(appointment)}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                swap_horiz
              </span>
              {DELEGATION_MESSAGES.ACTION_LABEL}
            </button>
          ) : null}
          {canDecide && appointment ? (
            <>
              <button
                type="button"
                className={STUDENT_UI.DANGER_BUTTON_CLASS}
                disabled={actionDisabled}
                onClick={() => onReject(appointment)}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  close
                </span>
                Reddet
              </button>
              <button
                type="button"
                className={STUDENT_UI.PRIMARY_BUTTON_CLASS}
                disabled={actionDisabled}
                onClick={() => onApprove(appointment)}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  check
                </span>
                Onayla
              </button>
            </>
          ) : null}
        </div>
      }
    >
      {appointment ? (
        <div className="bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="staff-appointment-detail-title"
                className="font-headline-md text-[18px] font-bold text-on-background"
              >
                {STAFF_APPOINTMENT_MESSAGES.DETAIL_TITLE}
              </h2>
              <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                Randevu #{appointment.appointmentId}
              </p>
            </div>
            <AppointmentStatusBadge status={appointment.appointmentStatus} />
          </div>

          <div className="mt-4 flex flex-col gap-4 border-t border-outline-variant/30 pt-4">
            {/* Date and Time Box */}
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-container/70 px-2.5 py-2 border border-outline-variant/40"
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

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetaRow
                icon="person"
                label="Öğrenci"
                value={appointment.studentName}
              />
              <MetaRow
                icon="category"
                label="Kategori"
                value={appointment.categoryName}
              />
              <MetaRow
                icon="videocam"
                label="Görüşme Türü"
                value={getMeetingTypeLabel(appointment.meetingType)}
              />
              <MetaRow
                icon="menu_book"
                label="Ders"
                value={
                  appointment.courseName
                    ? `${appointment.courseCode ?? ''} ${appointment.courseName}`.trim()
                    : '-'
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
