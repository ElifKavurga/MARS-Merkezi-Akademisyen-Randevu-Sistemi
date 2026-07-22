import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge';
import ConfirmModal from '../components/ConfirmModal';
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
  decideRescheduleApproval,
  getPendingRescheduleApproval,
  getStudentAppointment,
} from '../services/studentAppointmentService';
import type { AppointmentRescheduleApproval } from '../types/appointment';
import type { StudentAppointmentListItem } from '../types/studentAppointment';
import { resolveStudentApiError } from '../utils/studentApiError';
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

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 sm:p-4">
      <h2 className="mb-3 font-headline-md text-[16px] leading-5 font-semibold text-on-background">
        {title}
      </h2>
      {children}
    </section>
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
  const [rescheduleApproval, setRescheduleApproval] = useState<AppointmentRescheduleApproval | null>(null);
  const [rescheduleDecisionLoading, setRescheduleDecisionLoading] = useState(false);

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
      // Full-page error state already covers load failures; skip toast noise.
    } finally {
      setLoading(false);
    }
  }, [appointmentId, isValidId]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  useEffect(() => {
    if (!isValidId) return;
    void getPendingRescheduleApproval(appointmentId)
      .then(setRescheduleApproval)
      .catch(() => setRescheduleApproval(null));
  }, [appointmentId, isValidId]);

  const handleRescheduleDecision = async (accept: boolean) => {
    if (!rescheduleApproval || rescheduleDecisionLoading) return;
    setRescheduleDecisionLoading(true);
    try {
      await decideRescheduleApproval(rescheduleApproval.rescheduleRequestId, accept);
      setRescheduleApproval(null);
      toast.success(accept ? 'Yeni randevu zamanı kabul edildi.' : 'Yeniden planlama reddedildi ve randevu iptal edildi.');
      await loadAppointment();
    } catch (err) {
      toast.error(resolveStudentApiError(err, 'Yeniden planlama işlemi tamamlanamadı.'));
    } finally {
      setRescheduleDecisionLoading(false);
    }
  };

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

  const courseLabel = appointment ? formatStudentAppointmentCourseLabel(appointment) : null;
  const academicTitle =
    appointment?.academicTitle?.trim()
    || STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_TITLE;
  const canCancel = appointment ? isStudentAppointmentCancellable(appointment) : false;
  const isOnline = appointment?.meetingType === MEETING_TYPE.ONLINE;
  const office = appointment?.officeName?.trim() || null;
  const building = appointment?.officeLocation?.trim() || null;
  const dateLabel = appointment
    ? formatStudentAppointmentDate(appointment.appointmentDate)
    : '';
  const timeLabel = appointment
    ? `${formatStudentAppointmentTime(appointment.startTime)} – ${formatStudentAppointmentTime(appointment.endTime)}`
    : '';

  return (
    <div className="w-full min-w-0 animate-fade-in">
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
            className={STUDENT_UI.DANGER_BUTTON_CLASS}
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
        <div className="flex flex-col gap-3 md:gap-4">
          {rescheduleApproval ? (
            <section className="rounded-xl border border-primary-container/30 bg-primary-fixed/35 p-4 sm:p-5" aria-label="Yeniden planlama onayı">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-primary-container" aria-hidden>edit_calendar</span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-body-md text-base font-semibold text-on-surface">Akademisyen randevunuzu yeni bir tarihe taşımak istiyor.</h2>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 font-body-md text-sm text-on-surface-variant sm:grid-cols-2">
                    <div><dt className="font-semibold text-on-surface">Akademisyen</dt><dd>{rescheduleApproval.academicianName}</dd></div>
                    <div><dt className="font-semibold text-on-surface">Öğrenci</dt><dd>{rescheduleApproval.studentName}</dd></div>
                    <div><dt className="font-semibold text-on-surface">Eski tarih ve saat</dt><dd>{formatStudentAppointmentDate(rescheduleApproval.originalDate)}, {formatStudentAppointmentTime(rescheduleApproval.originalStartTime)} – {formatStudentAppointmentTime(rescheduleApproval.originalEndTime)}</dd></div>
                    <div><dt className="font-semibold text-on-surface">Yeni önerilen tarih ve saat</dt><dd>{formatStudentAppointmentDate(rescheduleApproval.proposedDate)}, {formatStudentAppointmentTime(rescheduleApproval.proposedStartTime)} – {formatStudentAppointmentTime(rescheduleApproval.proposedEndTime)}</dd></div>
                    <div><dt className="font-semibold text-on-surface">Görüşme türü</dt><dd>{getMeetingTypeLabel(rescheduleApproval.proposedMeetingType)}</dd></div>
                    <div><dt className="font-semibold text-on-surface">Kategori</dt><dd>{rescheduleApproval.categoryName}</dd></div>
                  </dl>
                  <p className="mt-1 font-body-md text-xs text-outline">
                    Son yanıt zamanı: {new Date(rescheduleApproval.expiresAt).toLocaleString('tr-TR')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={rescheduleDecisionLoading} onClick={() => void handleRescheduleDecision(true)} className={STUDENT_UI.PRIMARY_BUTTON_CLASS}>Kabul Et</button>
                    <button type="button" disabled={rescheduleDecisionLoading} onClick={() => void handleRescheduleDecision(false)} className={STUDENT_UI.SECONDARY_BUTTON_CLASS}>Reddet</button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
          <InfoCard title={STUDENT_APPOINTMENT_MESSAGES.DETAIL_SECTION_ACADEMICIAN}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-headline-md text-[16px] leading-5 font-semibold text-on-background">
                  {appointment.staffName}
                </h3>
                <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
                  {academicTitle}
                  {appointment.departmentName ? ` · ${appointment.departmentName}` : ''}
                </p>
              </div>
              <AppointmentStatusBadge status={appointment.appointmentStatus} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <MetaRow
                icon="badge"
                label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_FULL_NAME}
                value={appointment.staffName}
              />
              <MetaRow
                icon="school"
                label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_ACADEMIC_TITLE}
                value={academicTitle}
              />
              <MetaRow
                icon="apartment"
                label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_DEPARTMENT}
                value={appointment.departmentName}
              />
            </div>
          </InfoCard>

          <InfoCard title={STUDENT_APPOINTMENT_MESSAGES.DETAIL_SECTION_APPOINTMENT}>
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-container/70 px-2.5 py-2"
              aria-label={`${STUDENT_APPOINTMENT_MESSAGES.DETAIL_DATE}: ${dateLabel}, ${STUDENT_APPOINTMENT_MESSAGES.DETAIL_TIME}: ${timeLabel}`}
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

            <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <MetaRow
                icon="flag"
                label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_STATUS}
                value={<AppointmentStatusBadge status={appointment.appointmentStatus} />}
              />
              <MetaRow
                icon="category"
                label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_CATEGORY}
                value={appointment.categoryName}
              />
              <MetaRow
                icon="videocam"
                label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_MEETING_TYPE}
                value={getMeetingTypeLabel(appointment.meetingType)}
              />
              {courseLabel ? (
                <MetaRow
                  icon="menu_book"
                  label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_COURSE}
                  value={courseLabel}
                />
              ) : null}
            </div>
          </InfoCard>

          <InfoCard title={STUDENT_APPOINTMENT_MESSAGES.DETAIL_SECTION_LOCATION}>
            {isOnline ? (
              <MetaRow
                icon="language"
                label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_MEETING_TYPE}
                value={STUDENT_APPOINTMENT_MESSAGES.DETAIL_ONLINE_INFO}
              />
            ) : office || building ? (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <MetaRow
                  icon="meeting_room"
                  label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_OFFICE}
                  value={office ?? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_COURSE}
                />
                {building ? (
                  <MetaRow
                    icon="location_on"
                    label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_BUILDING}
                    value={building}
                  />
                ) : null}
              </div>
            ) : (
              <p className="font-body-md text-[13px] text-on-surface-variant">
                {STUDENT_APPOINTMENT_MESSAGES.DETAIL_LOCATION_EMPTY}
              </p>
            )}
          </InfoCard>
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
