import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StudentAppointmentStepper from '../components/StudentAppointmentStepper';
import StudentBackLink from '../components/StudentBackLink';
import StudentBreadcrumb from '../components/StudentBreadcrumb';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import UserAvatar from '../components/UserAvatar';
import {
  STUDENT_APPOINTMENT_ACTIVE_STEP_INDEX,
  STUDENT_APPOINTMENT_MESSAGES,
} from '../constants/studentAppointment';
import { studentAcademicianProfilePath, ROUTES } from '../constants/routes';
import { STUDENT_UI } from '../constants/studentUi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getStudentAcademicianDetail } from '../services/studentAcademicianService';
import type { StudentAcademicianDetail } from '../types/studentAcademician';
import {
  isStudentApiNotFound,
  resolveStudentApiError,
} from '../utils/studentApiError';

function AcademicianSummary({ academician }: { academician: StudentAcademicianDetail }) {
  return (
    <section
      className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6"
      aria-label="Seçilen akademisyen"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {academician.profilePhotoUrl ? (
          <img
            src={academician.profilePhotoUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-full border-2 border-primary-container object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary-container bg-surface-container">
            <UserAvatar fullName={academician.fullName} size="lg" />
          </div>
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="font-headline-md text-headline-md text-on-background">
            {academician.fullName}
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            {academician.academicTitle?.trim()
              ? academician.academicTitle
              : STUDENT_APPOINTMENT_MESSAGES.NO_TITLE}
          </p>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            {academician.departmentName}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function StudentAppointmentCreatePage() {
  const { academicianId: academicianIdParam } = useParams<{ academicianId: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const [academician, setAcademician] = useState<StudentAcademicianDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const academicianId = Number(academicianIdParam);
  const profilePath = Number.isInteger(academicianId) && academicianId >= 1
    ? studentAcademicianProfilePath(academicianId)
    : ROUTES.STUDENT_ACADEMICIAN_SEARCH;

  const loadAcademician = useCallback(async () => {
    if (!Number.isInteger(academicianId) || academicianId < 1) {
      setAcademician(null);
      setNotFound(true);
      setError(STUDENT_APPOINTMENT_MESSAGES.INVALID_ID);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setAcademician(await getStudentAcademicianDetail(academicianId));
    } catch (err) {
      const message = resolveStudentApiError(err, STUDENT_APPOINTMENT_MESSAGES.LOAD_ERROR, {
        notFoundMessage: STUDENT_APPOINTMENT_MESSAGES.NOT_FOUND,
      });
      setAcademician(null);
      setNotFound(isStudentApiNotFound(err));
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [academicianId, toast]);

  useEffect(() => {
    void loadAcademician();
  }, [loadAcademician]);

  if (!user) {
    return null;
  }

  const breadcrumb = (
    <StudentBreadcrumb
      items={[
        { label: STUDENT_UI.BREADCRUMB_HOME, to: ROUTES.STUDENT },
        { label: STUDENT_UI.BREADCRUMB_SEARCH, to: ROUTES.STUDENT_ACADEMICIAN_SEARCH },
        {
          label: academician?.fullName ?? STUDENT_UI.BREADCRUMB_PROFILE,
          to: profilePath,
        },
        { label: STUDENT_APPOINTMENT_MESSAGES.BREADCRUMB_CREATE },
      ]}
    />
  );

  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        {breadcrumb}
        <StudentPageHeader
          title={STUDENT_APPOINTMENT_MESSAGES.TITLE}
          description={STUDENT_APPOINTMENT_MESSAGES.SUBTITLE}
        />
        <StudentLoadingState label={STUDENT_APPOINTMENT_MESSAGES.LOADING} />
      </div>
    );
  }

  if (error || !academician) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        {breadcrumb}
        <StudentPageHeader
          title={STUDENT_APPOINTMENT_MESSAGES.TITLE}
          description={STUDENT_APPOINTMENT_MESSAGES.SUBTITLE}
        />
        <div className="mb-4">
          <StudentBackLink
            to={profilePath}
            label={STUDENT_APPOINTMENT_MESSAGES.BACK_TO_PROFILE}
          />
        </div>
        {notFound ? (
          <StudentEmptyState
            icon="person_off"
            title={STUDENT_APPOINTMENT_MESSAGES.NOT_FOUND}
            description={error ?? STUDENT_APPOINTMENT_MESSAGES.NOT_FOUND_DESCRIPTION}
          />
        ) : (
          <StudentErrorState
            message={error ?? STUDENT_UI.LOAD_ERROR_GENERIC}
            onRetry={() => void loadAcademician()}
            secondaryAction={{
              label: STUDENT_APPOINTMENT_MESSAGES.BACK_TO_PROFILE,
              to: profilePath,
            }}
          />
        )}
      </div>
    );
  }

  if (!academician.isAcceptingAppointments) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        {breadcrumb}
        <StudentPageHeader
          title={STUDENT_APPOINTMENT_MESSAGES.TITLE}
          description={STUDENT_APPOINTMENT_MESSAGES.SUBTITLE}
        />
        <div className="mb-4">
          <StudentBackLink
            to={profilePath}
            label={STUDENT_APPOINTMENT_MESSAGES.BACK_TO_PROFILE}
          />
        </div>
        <AcademicianSummary academician={academician} />
        <StudentEmptyState
          icon="event_busy"
          title={STUDENT_APPOINTMENT_MESSAGES.NOT_ACCEPTING_TITLE}
          description={STUDENT_APPOINTMENT_MESSAGES.NOT_ACCEPTING_DESCRIPTION}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      {breadcrumb}
      <StudentPageHeader
        title={STUDENT_APPOINTMENT_MESSAGES.TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.SUBTITLE}
      />

      <div className="mb-6">
        <StudentBackLink
          to={profilePath}
          label={STUDENT_APPOINTMENT_MESSAGES.BACK_TO_PROFILE}
        />
      </div>

      <AcademicianSummary academician={academician} />
      <StudentAppointmentStepper activeStepIndex={STUDENT_APPOINTMENT_ACTIVE_STEP_INDEX} />

      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <h2 className="font-headline-md text-headline-md text-primary">
          {STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_TITLE}
        </h2>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          {STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_DESCRIPTION}
        </p>
      </section>
    </div>
  );
}
