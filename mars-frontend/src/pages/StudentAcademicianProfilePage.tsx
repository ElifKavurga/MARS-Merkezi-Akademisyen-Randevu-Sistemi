import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import Loading from '../components/Loading';
import UserAvatar from '../components/UserAvatar';
import { STUDENT_ACADEMICIAN_MESSAGES } from '../constants/studentAcademician';
import { ROUTES } from '../constants/routes';
import { useToast } from '../hooks/useToast';
import { getStudentAcademicianDetail } from '../services/studentAcademicianService';
import type { StudentAcademicianDetail } from '../types/studentAcademician';

function resolveErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    if (err.response?.status === 403) {
      return STUDENT_ACADEMICIAN_MESSAGES.ACCESS_DENIED;
    }
    if (err.response?.status === 404) {
      return STUDENT_ACADEMICIAN_MESSAGES.PROFILE_NOT_FOUND;
    }
    const apiMessage = err.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim() !== '') {
      return apiMessage;
    }
  }
  return STUDENT_ACADEMICIAN_MESSAGES.PROFILE_LOAD_ERROR;
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
      const message = resolveErrorMessage(err);
      setProfile(null);
      setNotFound(isAxiosError(err) && err.response?.status === 404);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast, userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest">
        <Loading label={STUDENT_ACADEMICIAN_MESSAGES.PROFILE_LOADING} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
          <span
            className="material-symbols-outlined text-[42px] text-on-surface-variant/50"
            aria-hidden="true"
          >
            person_off
          </span>
          <h1 className="mt-3 font-headline-md text-headline-md text-on-background">
            {notFound
              ? STUDENT_ACADEMICIAN_MESSAGES.PROFILE_NOT_FOUND
              : STUDENT_ACADEMICIAN_MESSAGES.PROFILE_LOAD_ERROR}
          </h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant" role="alert">
            {error ?? STUDENT_ACADEMICIAN_MESSAGES.PROFILE_NOT_FOUND_DESCRIPTION}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!notFound ? (
              <button
                type="button"
                className="rounded-lg bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary"
                onClick={() => void loadProfile()}
              >
                Tekrar Dene
              </button>
            ) : null}
            <Link
              to={ROUTES.STUDENT_ACADEMICIAN_SEARCH}
              className="rounded-lg border border-outline-variant bg-surface px-4 py-2 font-label-md text-label-md text-primary no-underline hover:bg-surface-container hover:no-underline"
              style={{ textDecoration: 'none' }}
            >
              {STUDENT_ACADEMICIAN_MESSAGES.BACK_TO_SEARCH}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const accepting = profile.isAcceptingAppointments;
  const hasOfficeInfo =
    Boolean(profile.officeName?.trim()) || Boolean(profile.officeLocation?.trim());

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-6">
        <Link
          to={ROUTES.STUDENT_ACADEMICIAN_SEARCH}
          className="inline-flex items-center gap-1 font-label-md text-label-md text-primary no-underline hover:no-underline"
          style={{ textDecoration: 'none' }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            arrow_back
          </span>
          {STUDENT_ACADEMICIAN_MESSAGES.BACK_TO_SEARCH}
        </Link>
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
            <h1 className="font-headline-lg text-headline-lg text-on-background">
              {profile.fullName}
            </h1>
            <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
              {profile.academicTitle?.trim()
                ? profile.academicTitle
                : STUDENT_ACADEMICIAN_MESSAGES.NO_TITLE}
            </p>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {profile.departmentName}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <span
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-label-md text-label-md ${
                  accepting
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <span aria-hidden="true">{accepting ? '🟢' : '🔴'}</span>
                {accepting
                  ? STUDENT_ACADEMICIAN_MESSAGES.STATUS_ACCEPTING
                  : STUDENT_ACADEMICIAN_MESSAGES.STATUS_NOT_ACCEPTING}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  mail
                </span>
                <span className="truncate">{profile.institutionalEmail}</span>
              </span>
            </div>

            <div className="mt-6">
              <button
                type="button"
                disabled={!accepting}
                title={
                  accepting
                    ? undefined
                    : STUDENT_ACADEMICIAN_MESSAGES.BOOK_APPOINTMENT_DISABLED
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                // Sprint 22: randevu oluşturma ekranına yönlendirilecek.
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  event_available
                </span>
                {STUDENT_ACADEMICIAN_MESSAGES.BOOK_APPOINTMENT}
              </button>
            </div>
          </div>
        </div>
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
