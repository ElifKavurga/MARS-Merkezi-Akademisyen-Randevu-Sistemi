import { useCallback, useEffect, useState } from 'react';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge';
import StudentBreadcrumb from '../components/StudentBreadcrumb';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import { getMeetingTypeLabel } from '../constants/appointment';
import { ROUTES } from '../constants/routes';
import { STUDENT_APPOINTMENT_MESSAGES } from '../constants/studentAppointment';
import { STUDENT_UI } from '../constants/studentUi';
import { useToast } from '../hooks/useToast';
import { getStudentActiveAppointments } from '../services/studentAppointmentService';
import type { StudentAppointmentListItem } from '../types/studentAppointment';
import { resolveStudentApiError } from '../utils/studentApiError';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function formatCourseLabel(appointment: StudentAppointmentListItem): string {
  if (!appointment.courseCode && !appointment.courseName) {
    return STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_COURSE;
  }
  if (appointment.courseCode && appointment.courseName) {
    return `${appointment.courseCode} — ${appointment.courseName}`;
  }
  return appointment.courseCode ?? appointment.courseName ?? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_COURSE;
}

function AppointmentCard({ appointment }: { appointment: StudentAppointmentListItem }) {
  const title =
    appointment.academicTitle?.trim()
    || STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_NO_TITLE;

  const fields = [
    {
      label: STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_TITLE_LABEL,
      value: title,
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_DEPARTMENT,
      value: appointment.departmentName,
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_DATE,
      value: formatDate(appointment.appointmentDate),
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_TIME,
      value: `${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`,
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_CATEGORY,
      value: appointment.categoryName,
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_COURSE,
      value: formatCourseLabel(appointment),
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_MEETING_TYPE,
      value: getMeetingTypeLabel(appointment.meetingType),
    },
  ];

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-5 transition-colors hover:border-primary-container sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_ACADEMICIAN}
          </p>
          <h3 className="mt-1 truncate font-headline-md text-[18px] leading-6 font-semibold text-on-background">
            {appointment.staffName}
          </h3>
        </div>
        <AppointmentStatusBadge status={appointment.appointmentStatus} />
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0">
            <dt className="font-label-sm text-label-sm text-on-surface-variant">{field.label}</dt>
            <dd className="mt-0.5 break-words font-body-md text-body-md text-on-surface">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function StudentAppointmentsPage() {
  const toast = useToast();
  const [appointments, setAppointments] = useState<StudentAppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.appointmentId} appointment={appointment} />
          ))}
        </div>
      )}
    </div>
  );
}
