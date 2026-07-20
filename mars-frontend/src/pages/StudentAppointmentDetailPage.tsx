import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import StudentBreadcrumb from '../components/StudentBreadcrumb';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import { getMeetingTypeLabel } from '../constants/appointment';
import { MEETING_TYPE } from '../constants/availability';
import { ROUTES } from '../constants/routes';
import { STUDENT_APPOINTMENT_MESSAGES } from '../constants/studentAppointment';
import { STUDENT_UI } from '../constants/studentUi';
import { useToast } from '../hooks/useToast';
import {
  cancelStudentAppointment,
  getStudentAppointment,
} from '../services/studentAppointmentService';
import type { StudentAppointmentListItem } from '../types/studentAppointment';
import { resolveStudentApiError } from '../utils/studentApiError';
import { isStudentAppointmentCancellable } from '../utils/studentAppointmentCancel';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function formatCourseLabel(appointment: StudentAppointmentListItem): string | null {
  if (!appointment.courseCode && !appointment.courseName) {
    return null;
  }
  if (appointment.courseCode && appointment.courseName) {
    return `${appointment.courseCode} — ${appointment.courseName}`;
  }
  return appointment.courseCode ?? appointment.courseName;
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-label-sm text-label-sm text-on-surface-variant">{label}</dt>
      <dd className="mt-0.5 break-words font-body-md text-[15px] leading-6 text-on-surface">
        {value}
      </dd>
    </div>
  );
}

export default function StudentAppointmentDetailPage() {
  const { appointmentId: appointmentIdParam } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [appointment, setAppointment] = useState<StudentAppointmentListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const appointmentId = Number(appointmentIdParam);
  const isValidId = Number.isInteger(appointmentId) && appointmentId > 0;

  const loadAppointment = useCallback(async () => {
    if (!isValidId) {
      setAppointment(null);
      setError(STUDENT_APPOINTMENT_MESSAGES.DETAIL_INVALID_ID);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getStudentAppointment(appointmentId);
      setAppointment(data);
    } catch (err) {
      const message = resolveStudentApiError(
        err,
        STUDENT_APPOINTMENT_MESSAGES.DETAIL_LOAD_ERROR,
        {
          notFoundMessage: STUDENT_APPOINTMENT_MESSAGES.DETAIL_NOT_FOUND,
          accessDeniedMessage: STUDENT_APPOINTMENT_MESSAGES.DETAIL_ACCESS_DENIED,
          serverErrorMessage: STUDENT_APPOINTMENT_MESSAGES.DETAIL_LOAD_ERROR,
        },
      );
      setAppointment(null);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [appointmentId, isValidId, toast]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  const handleConfirmCancel = async () => {
    if (!appointment || cancelLoading) {
      return;
    }
    setCancelLoading(true);
    setCancelError(null);
    try {
      await cancelStudentAppointment(appointment.appointmentId);
      setCancelOpen(false);
      toast.success(STUDENT_APPOINTMENT_MESSAGES.CANCEL_SUCCESS);
      navigate(ROUTES.STUDENT_APPOINTMENTS, { replace: true });
    } catch (err) {
      const message = resolveStudentApiError(err, STUDENT_APPOINTMENT_MESSAGES.CANCEL_ERROR);
      setCancelError(message);
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  const courseLabel = appointment ? formatCourseLabel(appointment) : null;
  const academicTitle =
    appointment?.academicTitle?.trim()
    || STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_TITLE;
  const canCancel = appointment ? isStudentAppointmentCancellable(appointment) : false;
  const isOnline = appointment?.meetingType === MEETING_TYPE.ONLINE;
  const office = appointment?.officeName?.trim() || null;
  const building = appointment?.officeLocation?.trim() || null;

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <StudentBreadcrumb
        items={[
          { label: STUDENT_UI.BREADCRUMB_HOME, to: ROUTES.STUDENT },
          {
            label: STUDENT_UI.BREADCRUMB_APPOINTMENTS,
            to: ROUTES.STUDENT_APPOINTMENTS,
          },
          { label: STUDENT_APPOINTMENT_MESSAGES.DETAIL_TITLE },
        ]}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Link to={ROUTES.STUDENT_APPOINTMENTS} className={STUDENT_UI.BACK_LINK_CLASS}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            arrow_back
          </span>
          {STUDENT_APPOINTMENT_MESSAGES.DETAIL_BACK}
        </Link>
        {appointment && canCancel ? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error-container/40 px-3.5 py-2 font-label-md text-label-md text-error transition-colors hover:bg-error-container/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
            onClick={() => {
              setCancelError(null);
              setCancelOpen(true);
            }}
          >
            {STUDENT_APPOINTMENT_MESSAGES.CANCEL_ACTION}
          </button>
        ) : null}
      </div>

      <StudentPageHeader
        title={STUDENT_APPOINTMENT_MESSAGES.DETAIL_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.DETAIL_SUBTITLE}
      />

      {loading ? (
        <StudentLoadingState label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_LOADING} />
      ) : error ? (
        <StudentErrorState
          message={error}
          onRetry={isValidId ? () => void loadAppointment() : undefined}
          secondaryAction={{
            label: STUDENT_APPOINTMENT_MESSAGES.DETAIL_BACK,
            to: ROUTES.STUDENT_APPOINTMENTS,
          }}
        />
      ) : appointment ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant pb-3">
            <div className="min-w-0">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {STUDENT_APPOINTMENT_MESSAGES.DETAIL_SECTION_ACADEMICIAN}
              </p>
              <h2 className="mt-1 font-headline-md text-[20px] leading-6 font-semibold text-on-background">
                {appointment.staffName}
              </h2>
              <p className="mt-1 font-body-md text-[14px] text-on-surface-variant">
                {academicTitle}
                {appointment.departmentName ? ` · ${appointment.departmentName}` : ''}
              </p>
            </div>
            <AppointmentStatusBadge status={appointment.appointmentStatus} />
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_DATE}
              value={formatDate(appointment.appointmentDate)}
            />
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_MEETING_TYPE}
              value={getMeetingTypeLabel(appointment.meetingType)}
            />
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_START_TIME}
              value={formatTime(appointment.startTime)}
            />
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_END_TIME}
              value={formatTime(appointment.endTime)}
            />
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_CATEGORY}
              value={appointment.categoryName}
            />
            {courseLabel ? (
              <DetailField
                label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_COURSE}
                value={courseLabel}
              />
            ) : null}
          </dl>

          <div className="mt-4 border-t border-outline-variant pt-3">
            <h3 className="mb-2 font-label-md text-label-md font-semibold text-on-surface">
              {STUDENT_APPOINTMENT_MESSAGES.DETAIL_SECTION_LOCATION}
            </h3>
            {isOnline ? (
              <p className="font-body-md text-[14px] leading-6 text-on-surface">
                {STUDENT_APPOINTMENT_MESSAGES.DETAIL_ONLINE_INFO}
              </p>
            ) : office || building ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailField
                  label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_OFFICE}
                  value={office ?? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_COURSE}
                />
                {building ? (
                  <DetailField
                    label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_BUILDING}
                    value={building}
                  />
                ) : null}
              </dl>
            ) : (
              <p className="font-body-md text-[14px] text-on-surface-variant">
                {STUDENT_APPOINTMENT_MESSAGES.DETAIL_LOCATION_EMPTY}
              </p>
            )}
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={cancelOpen}
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
            setCancelOpen(false);
            setCancelError(null);
          }
        }}
      />
    </div>
  );
}
