import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import StudentAcceptingBadge from '../components/StudentAcceptingBadge';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import UserAvatar from '../components/UserAvatar';
import { MEETING_TYPE_OPTIONS } from '../constants/availability';
import {
  STUDENT_ACADEMICIAN_MESSAGES,
} from '../constants/studentAcademician';
import { studentAppointmentCreatePath } from '../constants/routes';
import { STUDENT_UI } from '../constants/studentUi';
import { useToast } from '../hooks/useToast';
import {
  getStudentAcademicianAvailability,
  getStudentAcademicianDetail,
} from '../services/studentAcademicianService';
import type { AvailableSlot } from '../types/appointment';
import type { StudentAcademicianDetail } from '../types/studentAcademician';
import {
  isStudentApiNotFound,
  resolveStudentApiError,
} from '../utils/studentApiError';

function formatSlotTime(value: string): string {
  return value.slice(0, 5);
}

function formatSlotDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('tr-TR');
}

function getAvailabilityMeetingTypeLabel(meetingType: string): string {
  return MEETING_TYPE_OPTIONS.find((item) => item.value === meetingType)?.label ?? meetingType;
}

export default function StudentAcademicianProfilePage() {
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const toast = useToast();
  const [profile, setProfile] = useState<StudentAcademicianDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const userId = Number(userIdParam);

  const loadProfile = useCallback(async () => {
    if (!Number.isInteger(userId) || userId < 1) {
      setProfile(null);
      setNotFound(true);
      setError(STUDENT_ACADEMICIAN_MESSAGES.PROFILE_NOT_FOUND);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setProfile(await getStudentAcademicianDetail(userId));
    } catch (err) {
      const message = resolveStudentApiError(err, STUDENT_ACADEMICIAN_MESSAGES.PROFILE_LOAD_ERROR, {
        notFoundMessage: STUDENT_ACADEMICIAN_MESSAGES.PROFILE_NOT_FOUND,
      });
      setProfile(null);
      setNotFound(isStudentApiNotFound(err));
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast, userId]);

  const loadAvailability = useCallback(async () => {
    if (!Number.isInteger(userId) || userId < 1) {
      setSlots([]);
      return;
    }

    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const data = await getStudentAcademicianAvailability(userId);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = resolveStudentApiError(
        err,
        STUDENT_ACADEMICIAN_MESSAGES.AVAILABILITY_LOAD_ERROR,
      );
      setSlots([]);
      setSlotsError(message);
      toast.error(message);
    } finally {
      setSlotsLoading(false);
    }
  }, [toast, userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) {
      void loadAvailability();
    } else {
      setSlots([]);
      setSlotsError(null);
    }
  }, [profile, loadAvailability]);

  const visibleSlots = useMemo(
    () =>
      [...slots].sort((left, right) => {
        const byDate = left.slotDate.localeCompare(right.slotDate);
        if (byDate !== 0) {
          return byDate;
        }
        return left.startTime.localeCompare(right.startTime);
      }),
    [slots],
  );


  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <StudentPageHeader
          title={STUDENT_UI.PROFILE_TITLE}
          description={STUDENT_UI.PROFILE_SUBTITLE}
        />
        <StudentLoadingState label={STUDENT_ACADEMICIAN_MESSAGES.PROFILE_LOADING} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <StudentPageHeader
          title={STUDENT_UI.PROFILE_TITLE}
          description={STUDENT_UI.PROFILE_SUBTITLE}
        />
        {notFound ? (
          <StudentEmptyState
            icon="person_off"
            title={STUDENT_ACADEMICIAN_MESSAGES.PROFILE_NOT_FOUND}
            description={
              error ?? STUDENT_ACADEMICIAN_MESSAGES.PROFILE_NOT_FOUND_DESCRIPTION
            }
          />
        ) : (
          <StudentErrorState
            message={error ?? STUDENT_UI.LOAD_ERROR_GENERIC}
            onRetry={() => void loadProfile()}
          />
        )}
      </div>
    );
  }

  const accepting = profile.isAcceptingAppointments;
  return (
    <div className="flex w-full min-w-0 animate-fade-in flex-col lg:-mt-2">
      <div className="mb-1">
        <h1 className="font-title-lg text-title-lg text-on-background">
          {STUDENT_UI.PROFILE_TITLE}
        </h1>
      </div>

      <div className="mb-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-2.5">
          <div className="flex flex-col gap-2.5 md:flex-row md:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary-container bg-surface-container font-headline-md text-base font-semibold text-primary">
              <UserAvatar fullName={profile.fullName} size="md" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-title-lg text-title-lg text-on-background">
                {profile.fullName}
              </h2>
              <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
                {profile.academicTitle?.trim()
                  ? profile.academicTitle
                  : STUDENT_ACADEMICIAN_MESSAGES.NO_TITLE}
              </p>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {profile.departmentName}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StudentAcceptingBadge
                  accepting={accepting}
                  activeLabel={STUDENT_ACADEMICIAN_MESSAGES.STATUS_ACCEPTING}
                  inactiveLabel={STUDENT_ACADEMICIAN_MESSAGES.STATUS_NOT_ACCEPTING}
                />
                <span className="inline-flex max-w-full items-start gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface">
                  <span className="material-symbols-outlined shrink-0 text-[18px]" aria-hidden="true">
                    mail
                  </span>
                  <span className="min-w-0 break-all leading-snug">{profile.institutionalEmail}</span>
                </span>
              </div>

              <div className="mt-1.5">
                {accepting ? (
                  <Link
                    to={studentAppointmentCreatePath(profile.userId)}
                    className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full px-4 py-1.5 sm:w-auto`}
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      event_available
                    </span>
                    {STUDENT_ACADEMICIAN_MESSAGES.BOOK_APPOINTMENT}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                  aria-disabled="true"
                  title={STUDENT_ACADEMICIAN_MESSAGES.BOOK_APPOINTMENT_DISABLED}
                  className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full px-4 py-1.5 sm:w-auto`}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      event_available
                    </span>
                    {STUDENT_ACADEMICIAN_MESSAGES.BOOK_APPOINTMENT}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-2.5">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">
              school
            </span>
            <h2 className="font-title-md text-title-md text-primary">
              {STUDENT_ACADEMICIAN_MESSAGES.COURSES_TITLE}
            </h2>
          </div>
          {profile.courses.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              {STUDENT_ACADEMICIAN_MESSAGES.COURSES_EMPTY}
            </p>
          ) : (
            <ul className="list-none divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface p-0">
              {profile.courses.map((course) => (
                <li
                  key={course.courseId}
                  className="flex flex-col gap-0.5 px-3 py-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-semibold text-primary">
                      {course.courseCode}
                    </p>
                    <p className="break-words font-body-md text-body-md text-on-surface">
                      {course.courseName}
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                    {course.academicTerm}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-2.5">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">
            schedule
          </span>
          <h2 className="font-title-md text-title-md text-primary">
            {STUDENT_ACADEMICIAN_MESSAGES.AVAILABILITY_TITLE}
          </h2>
        </div>

        {slotsLoading ? (
          <StudentLoadingState
            label={STUDENT_ACADEMICIAN_MESSAGES.AVAILABILITY_LOADING}
            compact
          />
        ) : slotsError ? (
          <StudentErrorState
            message={slotsError}
            onRetry={() => void loadAvailability()}
          />
        ) : visibleSlots.length === 0 ? (
          <StudentEmptyState
            icon="event_busy"
            title={STUDENT_ACADEMICIAN_MESSAGES.AVAILABILITY_EMPTY_TITLE}
            description={STUDENT_ACADEMICIAN_MESSAGES.AVAILABILITY_EMPTY}
            className="border-0 bg-surface px-4 py-6"
          />
        ) : (
          <ul className="grid list-none grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {visibleSlots.map((slot) => (
              <li
                key={slot.slotId}
                className="pointer-events-none select-none rounded-lg border border-outline-variant bg-surface p-1.5"
                aria-disabled="true"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-body-md text-body-md font-semibold text-primary">
                    {formatSlotDate(slot.slotDate)}
                  </p>
                  <span className="shrink-0 rounded bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                    {getAvailabilityMeetingTypeLabel(slot.meetingType)}
                  </span>
                </div>
                <p className="mt-0.5 font-body-md text-body-md text-on-surface">
                  {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
