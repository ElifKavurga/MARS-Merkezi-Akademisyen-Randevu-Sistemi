import { memo } from 'react';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { getMeetingTypeLabel, STAFF_APPOINTMENT_MESSAGES } from '../constants/appointment';
import { STUDENT_UI } from '../constants/studentUi';
import type { StaffAppointment } from '../types/appointment';

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

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function calcDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

type AcademicianAppointmentCardProps = {
  appointment: StaffAppointment;
  detailLoading?: boolean;
  onDetailClick: (appointmentId: number) => void;
};

function AcademicianAppointmentCard({
  appointment,
  detailLoading = false,
  onDetailClick,
}: AcademicianAppointmentCardProps) {
  const dateLabel = formatDate(appointment.appointmentDate);
  const startLabel = formatTime(appointment.startTime);
  const endLabel = formatTime(appointment.endTime);
  const duration = calcDurationMinutes(appointment.startTime, appointment.endTime);
  const courseLabel = appointment.courseName
    ? `${appointment.courseCode ?? ''} ${appointment.courseName}`.trim()
    : null;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 transition-colors hover:border-primary-container/40 sm:p-4">
      {/* Header: Öğrenci adı + Durum */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-headline-md text-[16px] leading-5 font-semibold text-on-background">
            {appointment.studentName}
          </h3>
          <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
            {appointment.categoryName}
          </p>
        </div>
        <div className="shrink-0">
          <AppointmentStatusBadge status={appointment.appointmentStatus} />
        </div>
      </div>

      {/* Tarih & Saat bilgi satırı */}
      <div
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-container/70 px-2.5 py-2"
        aria-label={`Tarih: ${dateLabel}, Saat: ${startLabel} – ${endLabel}`}
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
          {startLabel} – {endLabel}
        </div>
      </div>

      {/* Metadata satırları */}
      <div className="mt-2.5 grid flex-1 grid-cols-1 content-start gap-1.5 sm:grid-cols-2">
        <MetaRow
          icon="videocam"
          label="Görüşme Türü"
          value={getMeetingTypeLabel(appointment.meetingType)}
        />
        <MetaRow
          icon="timer"
          label="Süre"
          value={`${duration} ${STAFF_APPOINTMENT_MESSAGES.DURATION_MIN}`}
        />
        {courseLabel ? (
          <MetaRow
            icon="menu_book"
            label="Ders"
            value={courseLabel}
          />
        ) : null}
      </div>

      {/* Footer: Detayları Gör butonu */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-outline-variant/70 pt-3">
        <button
          type="button"
          className={STUDENT_UI.SECONDARY_BUTTON_CLASS}
          disabled={detailLoading}
          onClick={() => onDetailClick(appointment.appointmentId)}
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden>
            visibility
          </span>
          {detailLoading ? 'Yükleniyor...' : STAFF_APPOINTMENT_MESSAGES.VIEW_DETAIL}
        </button>
      </div>
    </article>
  );
}

export default memo(AcademicianAppointmentCard);
