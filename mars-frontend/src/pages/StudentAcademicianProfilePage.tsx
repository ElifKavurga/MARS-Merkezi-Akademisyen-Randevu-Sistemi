import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import StudentAcceptingBadge from '../components/StudentAcceptingBadge';
import StudentBackLink from '../components/StudentBackLink';
import StudentBreadcrumb from '../components/StudentBreadcrumb';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import UserAvatar from '../components/UserAvatar';
import { MEETING_TYPE_OPTIONS } from '../constants/availability';
import {
  MINIMUM_BOOKING_NOTICE_MINUTES,
  STUDENT_ACADEMICIAN_MESSAGES,
} from '../constants/studentAcademician';
import { studentAppointmentCreatePath, ROUTES } from '../constants/routes';
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

/** BR-017: slot başlangıcı şu andan + notice süresinden önce olmamalı. */
function isSlotAfterBookingNotice(slot: AvailableSlot, now = new Date()): boolean {
  const [year, month, day] = slot.slotDate.split('-').map(Number);
  const [hour, minute] = formatSlotTime(slot.startTime).split(':').map(Number);
  const slotStart = new Date(year, month - 1, day, hour, minute, 0, 0);
  const earliest = new Date(now.getTime() + MINIMUM_BOOKING_NOTICE_MINUTES * 60_000);
  return slotStart.getTime() >= earliest.getTime();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start">
      <dt className="font-label-md text-label-md text-on-surface-variant">{label}</dt>
      <dd className="break-words font-body-md text-body-md text-on-surface">{value}</dd>
    </div>
  );
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
      setSlots(data.filter((slot) => isSlotAfterBookingNotice(slot)));
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

  const breadcrumb = (
    <StudentBreadcrumb
      items={[
        { label: STUDENT_UI.BREADCRUMB_HOME, to: ROUTES.STUDENT },
        { label: STUDENT_UI.BREADCRUMB_SEARCH, to: ROUTES.STUDENT_ACADEMICIAN_SEARCH },
        { label: STUDENT_UI.BREADCRUMB_PROFILE },
      ]}
    />
  );

  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        {breadcrumb}
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
        {breadcrumb}
        <StudentPageHeader
          title={STUDENT_UI.PROFILE_TITLE}
          description={STUDENT_UI.PROFILE_SUBTITLE}
        />
        <div className="mb-4">
          <StudentBackLink
            to={ROUTES.STUDENT_ACADEMICIAN_SEARCH}
            label={STUDENT_ACADEMICIAN_MESSAGES.BACK_TO_SEARCH}
          />
        </div>
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
            secondaryAction={{
              label: STUDENT_ACADEMICIAN_MESSAGES.BACK_TO_SEARCH,
              to: ROUTES.STUDENT_ACADEMICIAN_SEARCH,
            }}
          />
        )}
      </div>
    );
  }

  const accepting = profile.isAcceptingAppointments;
  const hasOfficeInfo =
    Boolean(profile.officeName?.trim()) || Boolean(profile.officeLocation?.trim());

  return (
    <div className="w-full min-w-0 animate-fade-in">
      {breadcrumb}
      <StudentPageHeader
        title={STUDENT_UI.PROFILE_TITLE}
        description={STUDENT_UI.PROFILE_SUBTITLE}
      />

      <div className="mb-6">
        <StudentBackLink
          to={ROUTES.STUDENT_ACADEMICIAN_SEARCH}
          label={STUDENT_ACADEMICIAN_MESSAGES.BACK_TO_SEARCH}
        />
      </div>

      <section className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {profile.profilePhotoUrl ? (
            <img
              src={profile.profilePhotoUrl}
              alt=""
              className="h-28 w-28 shrink-0 rounded-full border-2 border-primary-container object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2 border-primary-container bg-surface-container font-headline-md text-2xl font-semibold text-primary">
              <UserAvatar fullName={profile.fullName} size="lg" />
            </div>
          )}

          <div className="min-w-0 flex-1 text-center md:text-left">
            <h2 className="font-headline-lg text-headline-lg text-on-background">
              {profile.fullName}
            </h2>
            <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
              {profile.academicTitle?.trim()
                ? profile.academicTitle
                : STUDENT_ACADEMICIAN_MESSAGES.NO_TITLE}
            </p>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {profile.departmentName}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <StudentAcceptingBadge
                accepting={accepting}
                activeLabel={STUDENT_ACADEMICIAN_MESSAGES.STATUS_ACCEPTING}
                inactiveLabel={STUDENT_ACADEMICIAN_MESSAGES.STATUS_NOT_ACCEPTING}
              />
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface">
                <span className="material-symbols-outlined shrink-0 text-[18px]" aria-hidden="true">
                  mail
                </span>
                <span className="truncate">{profile.institutionalEmail}</span>
              </span>
            </div>

            <div className="mt-6">
              {accepting ? (
                <Link
                  to={studentAppointmentCreatePath(profile.userId)}
                  className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
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
                  className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
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

      <section className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">
            schedule
          </span>
          <h2 className="font-headline-md text-headline-md text-primary">
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
            className="border-0 bg-surface px-4 py-8"
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleSlots.map((slot) => (
              <li
                key={slot.slotId}
                className="pointer-events-none select-none rounded-xl border border-outline-variant bg-surface p-4"
                aria-disabled="true"
              >
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                  {STUDENT_ACADEMICIAN_MESSAGES.AVAILABILITY_DATE}
                </p>
                <p className="mt-1 font-body-md text-body-md font-semibold text-primary">
                  {formatSlotDate(slot.slotDate)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {STUDENT_ACADEMICIAN_MESSAGES.AVAILABILITY_START}
                    </p>
                    <p className="font-body-md text-body-md text-on-surface">
                      {formatSlotTime(slot.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {STUDENT_ACADEMICIAN_MESSAGES.AVAILABILITY_END}
                    </p>
                    <p className="font-body-md text-body-md text-on-surface">
                      {formatSlotTime(slot.endTime)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">
                  {STUDENT_ACADEMICIAN_MESSAGES.AVAILABILITY_MEETING_TYPE}
                </p>
                <p className="mt-1 font-body-md text-body-md text-on-surface">
                  {getAvailabilityMeetingTypeLabel(slot.meetingType)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6 lg:col-span-7">
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">
              school
            </span>
            <h2 className="font-headline-md text-headline-md text-primary">
              {STUDENT_ACADEMICIAN_MESSAGES.COURSES_TITLE}
            </h2>
          </div>
          {profile.courses.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              {STUDENT_ACADEMICIAN_MESSAGES.COURSES_EMPTY}
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface">
              {profile.courses.map((course) => (
                <li
                  key={course.courseId}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-body-md text-body-md font-semibold text-primary">
                      {course.courseCode}
                    </p>
                    <p className="truncate font-body-md text-body-md text-on-surface">
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

        <div className="flex flex-col gap-6 lg:col-span-5">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">
                meeting_room
              </span>
              <h2 className="font-headline-md text-headline-md text-primary">
                {STUDENT_ACADEMICIAN_MESSAGES.OFFICE_TITLE}
              </h2>
            </div>
            {hasOfficeInfo ? (
              <dl className="space-y-3">
                {profile.officeName?.trim() ? (
                  <InfoRow
                    label={STUDENT_ACADEMICIAN_MESSAGES.OFFICE_NAME}
                    value={profile.officeName}
                  />
                ) : null}
                {profile.officeLocation?.trim() ? (
                  <InfoRow
                    label={STUDENT_ACADEMICIAN_MESSAGES.OFFICE_LOCATION}
                    value={profile.officeLocation}
                  />
                ) : null}
              </dl>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant">
                {STUDENT_ACADEMICIAN_MESSAGES.OFFICE_EMPTY}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">
                info
              </span>
              <h2 className="font-headline-md text-headline-md text-primary">
                {STUDENT_ACADEMICIAN_MESSAGES.ABOUT_TITLE}
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {profile.about?.trim()
                ? profile.about
                : STUDENT_ACADEMICIAN_MESSAGES.ABOUT_EMPTY}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
