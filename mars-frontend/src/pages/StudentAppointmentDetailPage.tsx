import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge';
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
import { getStudentAppointment } from '../services/studentAppointmentService';
import type { StudentAppointmentListItem } from '../types/studentAppointment';
import { resolveStudentApiError } from '../utils/studentApiError';

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
      <dd className="mt-1 break-words font-body-md text-body-md text-on-surface">{value}</dd>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2 className="mb-4 font-headline-md text-[18px] leading-6 font-semibold text-primary">
        {title}
      </h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function LocationSection({ appointment }: { appointment: StudentAppointmentListItem }) {
  const isOnline = appointment.meetingType === MEETING_TYPE.ONLINE;

  if (isOnline) {
    return (
      <DetailSection title={STUDENT_APPOINTMENT_MESSAGES.DETAIL_SECTION_LOCATION}>
        <div className="sm:col-span-2">
          <p className="font-body-md text-body-md text-on-surface">
            {STUDENT_APPOINTMENT_MESSAGES.DETAIL_ONLINE_INFO}
          </p>
        </div>
      </DetailSection>
    );
  }

  const office = appointment.officeName?.trim() || null;
  const building = appointment.officeLocation?.trim() || null;

  return (
    <DetailSection title={STUDENT_APPOINTMENT_MESSAGES.DETAIL_SECTION_LOCATION}>
      {office || building ? (
        <>
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
        </>
      ) : (
        <div className="sm:col-span-2">
          <p className="font-body-md text-body-md text-on-surface-variant">
            {STUDENT_APPOINTMENT_MESSAGES.DETAIL_LOCATION_EMPTY}
          </p>
        </div>
      )}
    </DetailSection>
  );
}

export default function StudentAppointmentDetailPage() {
  const { appointmentId: appointmentIdParam } = useParams<{ appointmentId: string }>();
  const toast = useToast();
  const [appointment, setAppointment] = useState<StudentAppointmentListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const courseLabel = appointment ? formatCourseLabel(appointment) : null;
  const academicTitle =
    appointment?.academicTitle?.trim()
    || STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_TITLE;

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

      <div className="mb-4">
        <Link to={ROUTES.STUDENT_APPOINTMENTS} className={STUDENT_UI.BACK_LINK_CLASS}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            arrow_back
          </span>
          {STUDENT_APPOINTMENT_MESSAGES.DETAIL_BACK}
        </Link>
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
        <div className="flex flex-col gap-4 md:gap-5">
          <DetailSection title={STUDENT_APPOINTMENT_MESSAGES.DETAIL_SECTION_ACADEMICIAN}>
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_FULL_NAME}
              value={appointment.staffName}
            />
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_ACADEMIC_TITLE}
              value={academicTitle}
            />
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_DEPARTMENT}
              value={appointment.departmentName}
            />
          </DetailSection>

          <DetailSection title={STUDENT_APPOINTMENT_MESSAGES.DETAIL_SECTION_APPOINTMENT}>
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_DATE}
              value={formatDate(appointment.appointmentDate)}
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
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_STATUS}
              value={<AppointmentStatusBadge status={appointment.appointmentStatus} />}
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
            <DetailField
              label={STUDENT_APPOINTMENT_MESSAGES.DETAIL_MEETING_TYPE}
              value={getMeetingTypeLabel(appointment.meetingType)}
            />
          </DetailSection>

          <LocationSection appointment={appointment} />
        </div>
      ) : null}
    </div>
  );
}
