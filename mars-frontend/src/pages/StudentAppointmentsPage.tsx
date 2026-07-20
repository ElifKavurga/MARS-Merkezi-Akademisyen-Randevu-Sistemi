import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import StudentBreadcrumb from '../components/StudentBreadcrumb';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import { getMeetingTypeLabel } from '../constants/appointment';
import { ROUTES, studentAppointmentDetailPath } from '../constants/routes';
import { STUDENT_APPOINTMENT_MESSAGES } from '../constants/studentAppointment';
import { STUDENT_UI } from '../constants/studentUi';
import { useToast } from '../hooks/useToast';
import {
  cancelStudentAppointment,
  getStudentActiveAppointments,
} from '../services/studentAppointmentService';
import type { StudentAppointmentListItem } from '../types/studentAppointment';
import { resolveStudentApiError } from '../utils/studentApiError';
import { isStudentAppointmentCancellable } from '../utils/studentAppointmentCancel';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
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

function AppointmentCard({
  appointment,
  cancelLoading,
  onCancelRequest,
}: {
  appointment: StudentAppointmentListItem;
  cancelLoading: boolean;
  onCancelRequest: (appointment: StudentAppointmentListItem) => void;
}) {
  const canCancel = isStudentAppointmentCancellable(appointment);
  const title =
    appointment.academicTitle?.trim()
    || STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_TITLE;
  const courseLabel =
    appointment.courseCode && appointment.courseName
      ? `${appointment.courseCode} — ${appointment.courseName}`
      : appointment.courseCode ?? appointment.courseName;

  return (
    <article className="flex min-w-0 flex-col rounded-lg border border-outline-variant bg-surface-container-lowest p-3.5 sm:p-4">
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
        <AppointmentStatusBadge status={appointment.appointmentStatus} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-surface-container/60 px-2.5 py-2">
        <div className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
            event
          </span>
          {formatDate(appointment.appointmentDate)}
        </div>
        <div className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
            schedule
          </span>
          {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
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
          style={{ textDecoration: 'none', padding: '0.5rem 0.875rem' }}
        >
          {STUDENT_APPOINTMENT_MESSAGES.VIEW_DETAIL}
        </Link>
        {canCancel ? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error-container/40 px-3.5 py-2 font-label-md text-label-md text-error transition-colors hover:bg-error-container/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:cursor-not-allowed disabled:opacity-50"
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

export default function StudentAppointmentsPage() {
  const toast = useToast();
  const [appointments, setAppointments] = useState<StudentAppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<StudentAppointmentListItem | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentActiveAppointments();
      setAppointments(data);
    } catch (err) {
      const message = resolveStudentApiError(
        err,
        STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_LOAD_ERROR,
      );
      setAppointments([]);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || cancelLoading) {
      return;
    }
    setCancelLoading(true);
    setCancelError(null);
    try {
      await cancelStudentAppointment(cancelTarget.appointmentId);
      setAppointments((current) =>
        current.filter((item) => item.appointmentId !== cancelTarget.appointmentId),
      );
      setCancelTarget(null);
      toast.success(STUDENT_APPOINTMENT_MESSAGES.CANCEL_SUCCESS);
    } catch (err) {
      const message = resolveStudentApiError(err, STUDENT_APPOINTMENT_MESSAGES.CANCEL_ERROR);
      setCancelError(message);
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <StudentBreadcrumb
        items={[
          { label: STUDENT_UI.BREADCRUMB_HOME, to: ROUTES.STUDENT },
          { label: STUDENT_UI.BREADCRUMB_APPOINTMENTS },
        ]}
      />
      <StudentPageHeader
        title={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_SUBTITLE}
      />

      {loading ? (
        <StudentLoadingState label={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_LOADING} />
      ) : error ? (
        <StudentErrorState message={error} onRetry={() => void loadAppointments()} />
      ) : appointments.length === 0 ? (
        <StudentEmptyState
          icon="event_note"
          title={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_EMPTY_TITLE}
          description={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_EMPTY_DESCRIPTION}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.appointmentId}
              appointment={appointment}
              cancelLoading={cancelLoading}
              onCancelRequest={(item) => {
                setCancelError(null);
                setCancelTarget(item);
              }}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={cancelTarget !== null}
        title={STUDENT_APPOINTMENT_MESSAGES.CANCEL_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.CANCEL_DESCRIPTION}
        confirmLabel={STUDENT_APPOINTMENT_MESSAGES.CANCEL_CONFIRM}
        cancelLabel={STUDENT_APPOINTMENT_MESSAGES.CANCEL_DISMISS}
        variant="danger"
        loading={cancelLoading}
        error={cancelError}
        onConfirm={() => void handleConfirmCancel()}
        onClose={() => {
          if (!cancelLoading) {
            setCancelTarget(null);
            setCancelError(null);
          }
        }}
      />
    </div>
  );
}
