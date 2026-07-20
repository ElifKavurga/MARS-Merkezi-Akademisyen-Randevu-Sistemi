import { Link } from 'react-router-dom';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { getMeetingTypeLabel } from '../constants/appointment';
import { studentAppointmentDetailPath } from '../constants/routes';
import { STUDENT_APPOINTMENT_MESSAGES } from '../constants/studentAppointment';
import { STUDENT_UI } from '../constants/studentUi';
import type { StudentAppointmentListItem } from '../types/studentAppointment';
import { isStudentAppointmentCancellable } from '../utils/studentAppointmentCancel';
import {
  formatStudentAppointmentCourseLabel,
  formatStudentAppointmentDate,
  formatStudentAppointmentTime,
} from '../utils/studentAppointmentFormat';

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

type StudentAppointmentCardProps = {
  appointment: StudentAppointmentListItem;
  showCancel?: boolean;
  cancelLoading?: boolean;
  onCancelRequest?: (appointment: StudentAppointmentListItem) => void;
};

export default function StudentAppointmentCard({
  appointment,
  showCancel = false,
  cancelLoading = false,
  onCancelRequest,
}: StudentAppointmentCardProps) {
  const canCancel = showCancel && isStudentAppointmentCancellable(appointment);
  const title =
    appointment.academicTitle?.trim()
    || STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_TITLE;
  const courseLabel = formatStudentAppointmentCourseLabel(appointment);
  const dateLabel = formatStudentAppointmentDate(appointment.appointmentDate);
  const timeLabel = `${formatStudentAppointmentTime(appointment.startTime)} – ${formatStudentAppointmentTime(appointment.endTime)}`;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 transition-colors hover:border-primary-container/40 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-headline-md text-[16px] leading-5 font-semibold text-on-background">
            {appointment.staffName}
          </h3>
          <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
            {title}
            {appointment.departmentName ? ` · ${appointment.departmentName}` : ''}
          </p>
        </div>
        <div className="shrink-0">
          <AppointmentStatusBadge status={appointment.appointmentStatus} />
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-container/70 px-2.5 py-2"
        aria-label={`${STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_DATE}: ${dateLabel}, ${STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_TIME}: ${timeLabel}`}
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

      <div className="mt-2.5 grid flex-1 grid-cols-1 content-start gap-1.5 sm:grid-cols-2">
        <MetaRow
          icon="category"
          label={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_CATEGORY}
          value={appointment.categoryName}
        />
        <MetaRow
          icon="videocam"
          label={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_MEETING_TYPE}
          value={getMeetingTypeLabel(appointment.meetingType)}
        />
        {courseLabel ? (
          <MetaRow
            icon="menu_book"
            label={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_COURSE}
            value={courseLabel}
          />
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-outline-variant/70 pt-3">
        <Link
          to={studentAppointmentDetailPath(appointment.appointmentId)}
          className={STUDENT_UI.SECONDARY_BUTTON_CLASS}
        >
          {STUDENT_APPOINTMENT_MESSAGES.VIEW_DETAIL}
        </Link>
        {canCancel && onCancelRequest ? (
          <button
            type="button"
            className={STUDENT_UI.DANGER_BUTTON_CLASS}
            disabled={cancelLoading}
            onClick={() => onCancelRequest(appointment)}
          >
            {STUDENT_APPOINTMENT_MESSAGES.CANCEL_ACTION}
          </button>
        ) : null}
      </div>
    </article>
  );
}
