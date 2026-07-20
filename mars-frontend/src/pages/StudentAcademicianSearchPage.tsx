import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import DepartmentSelect from '../components/DepartmentSelect';
import Loading from '../components/Loading';
import UserAvatar from '../components/UserAvatar';
import {
  STUDENT_ACADEMICIAN_MESSAGES,
  STUDENT_ACADEMICIAN_PAGE_SIZE,
} from '../constants/studentAcademician';
import { studentAcademicianProfilePath } from '../constants/routes';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants/ui';
import { useToast } from '../hooks/useToast';
import {
  getStudentAcademicianTitles,
  searchStudentAcademicians,
} from '../services/studentAcademicianService';
import type {
  StudentAcademician,
  StudentAcademicianPage,
  StudentAcademicianSort,
} from '../types/studentAcademician';

type AppliedFilters = {
  search: string;
  departmentId?: number;
  academicTitle?: string;
  isAcceptingAppointments?: boolean;
  sort: StudentAcademicianSort;
};

function resolveErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    if (err.response?.status === 403) {
      return STUDENT_ACADEMICIAN_MESSAGES.ACCESS_DENIED;
    }
    const apiMessage = err.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim() !== '') {
      return apiMessage;
    }
  }
  return STUDENT_ACADEMICIAN_MESSAGES.LOAD_ERROR;
}

function AcademicianCard({ academician }: { academician: StudentAcademician }) {
  const accepting = academician.isAcceptingAppointments;

  return (
    <article
      className="flex h-full flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
      data-academician-id={academician.userId}
    >
      <div className="flex items-start gap-4">
        {academician.profilePhotoUrl ? (
          <img
            src={academician.profilePhotoUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full border border-outline-variant object-cover"
          />
        ) : (
          <UserAvatar fullName={academician.fullName} size="lg" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 truncate font-headline-md text-body-lg text-primary">
              {academician.fullName}
            </h3>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 font-label-sm text-label-sm ${
                accepting
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  accepting ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                aria-hidden="true"
              />
              {accepting
                ? STUDENT_ACADEMICIAN_MESSAGES.STATUS_ACTIVE
                : STUDENT_ACADEMICIAN_MESSAGES.STATUS_INACTIVE}
            </span>
          </div>
          <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
            {academician.academicTitle?.trim()
              ? academician.academicTitle
              : STUDENT_ACADEMICIAN_MESSAGES.NO_TITLE}
          </p>
        </div>
      </div>

      <dl className="space-y-2 border-t border-outline-variant pt-4">
        <div className="flex items-start gap-2">
          <dt className="sr-only">Bölüm</dt>
          <dd className="flex min-w-0 items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              apartment
            </span>
            <span className="truncate">{academician.departmentName}</span>
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <dt className="sr-only">E-posta</dt>
          <dd className="flex min-w-0 items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              mail
            </span>
            <span className="truncate">{academician.institutionalEmail}</span>
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-2">
        <Link
          to={studentAcademicianProfilePath(academician.userId)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 font-label-md text-label-md text-primary no-underline transition-colors hover:bg-surface-container hover:no-underline focus:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
          style={{ textDecoration: 'none' }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            person
          </span>
          {STUDENT_ACADEMICIAN_MESSAGES.VIEW_PROFILE}
        </Link>
      </div>
    </article>
  );
}

export default function StudentAcademicianSearchPage() {
  const toast = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [departmentId, setDepartmentId] = useState(0);
  const [academicTitle, setAcademicTitle] = useState('');
  const [acceptingFilter, setAcceptingFilter] = useState('');
  const [sortInput, setSortInput] = useState<StudentAcademicianSort>('NAME_ASC');
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [applied, setApplied] = useState<AppliedFilters>({
    search: '',
    sort: 'NAME_ASC',
  });
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<StudentAcademicianPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadTitles = async () => {
      try {
        const titles = await getStudentAcademicianTitles();
        if (!cancelled) {
          setTitleOptions(titles);
        }
      } catch {
        if (!cancelled) {
          setTitleOptions([]);
        }
      }
    };
    void loadTitles();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAcademicians = useCallback(
    async (filters: AppliedFilters, pageIndex: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchStudentAcademicians({
          search: filters.search || undefined,
          departmentId: filters.departmentId,
          academicTitle: filters.academicTitle,
          isAcceptingAppointments: filters.isAcceptingAppointments,
          sort: filters.sort,
          page: pageIndex,
          size: STUDENT_ACADEMICIAN_PAGE_SIZE,
        });
        setResult(data);
      } catch (err) {
        const message = resolveErrorMessage(err);
        setResult(null);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadAcademicians(applied, page);
  }, [applied, page, loadAcademicians]);

  const applyFilters = () => {
    setPage(0);
    setApplied({
      search: searchInput.trim(),
      departmentId: departmentId > 0 ? departmentId : undefined,
      academicTitle: academicTitle.trim() || undefined,
      isAcceptingAppointments:
        acceptingFilter === 'true'
          ? true
          : acceptingFilter === 'false'
            ? false
            : undefined,
      sort: sortInput,
    });
  };

  const totalElements = result?.totalElements ?? 0;
  const totalPages = result?.totalPages ?? 0;
  const academicians = result?.content ?? [];

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          {STUDENT_ACADEMICIAN_MESSAGES.TITLE}
        </h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          {STUDENT_ACADEMICIAN_MESSAGES.SUBTITLE}
        </p>
      </div>

      <section className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-6">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <div className="relative min-w-0">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="search"
              className={`${FORM_FIELD_CLASS} pl-10`}
              placeholder={STUDENT_ACADEMICIAN_MESSAGES.SEARCH_PLACEHOLDER}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Ad, soyad veya bölüm ara"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DepartmentSelect
              id="student-academician-department"
              value={departmentId}
              onChange={setDepartmentId}
              allowEmpty
              emptyLabel={STUDENT_ACADEMICIAN_MESSAGES.DEPARTMENT_ALL}
              className={FORM_SELECT_CLASS}
            />

            <select
              className={FORM_SELECT_CLASS}
              aria-label="Akademik ünvan filtresi"
              value={academicTitle}
              onChange={(event) => setAcademicTitle(event.target.value)}
            >
              <option value="">{STUDENT_ACADEMICIAN_MESSAGES.TITLE_ALL}</option>
              {titleOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>

            <select
              className={FORM_SELECT_CLASS}
              aria-label="Randevu kabul durumu filtresi"
              value={acceptingFilter}
              onChange={(event) => setAcceptingFilter(event.target.value)}
            >
              <option value="">{STUDENT_ACADEMICIAN_MESSAGES.ACCEPTING_ALL}</option>
              <option value="true">{STUDENT_ACADEMICIAN_MESSAGES.ACCEPTING_ACTIVE}</option>
              <option value="false">{STUDENT_ACADEMICIAN_MESSAGES.ACCEPTING_INACTIVE}</option>
            </select>

            <select
              className={FORM_SELECT_CLASS}
              aria-label={STUDENT_ACADEMICIAN_MESSAGES.SORT_LABEL}
              value={sortInput}
              onChange={(event) => setSortInput(event.target.value as StudentAcademicianSort)}
            >
              <option value="NAME_ASC">{STUDENT_ACADEMICIAN_MESSAGES.SORT_NAME_ASC}</option>
              <option value="NAME_DESC">{STUDENT_ACADEMICIAN_MESSAGES.SORT_NAME_DESC}</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                search
              </span>
              {STUDENT_ACADEMICIAN_MESSAGES.FILTER}
            </button>
          </div>
        </form>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-body-lg text-body-lg font-bold text-on-background">
          {STUDENT_ACADEMICIAN_MESSAGES.RESULTS}
          {!loading && !error ? (
            <span className="rounded-full bg-surface-container-highest px-2 py-0.5 font-label-sm text-label-sm text-primary">
              {totalElements}
            </span>
          ) : null}
        </h2>
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Loading label={STUDENT_ACADEMICIAN_MESSAGES.LOADING} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error/30 bg-error-container/40 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="font-body-md text-body-md text-on-error-container" role="alert">
              {error}
            </p>
            <button
              type="button"
              className="rounded-lg bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary"
              onClick={() => void loadAcademicians(applied, page)}
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      ) : academicians.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-10 text-center">
          <span
            className="material-symbols-outlined text-[42px] text-on-surface-variant/50"
            aria-hidden="true"
          >
            person_search
          </span>
          <h3 className="mt-3 font-headline-md text-headline-md text-on-background">
            {STUDENT_ACADEMICIAN_MESSAGES.EMPTY_TITLE}
          </h3>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            {STUDENT_ACADEMICIAN_MESSAGES.EMPTY_DESCRIPTION}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {academicians.map((academician) => (
              <AcademicianCard key={academician.userId} academician={academician} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {STUDENT_ACADEMICIAN_MESSAGES.PAGE_OF(page + 1, totalPages)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-md text-label-md text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={result?.first}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  {STUDENT_ACADEMICIAN_MESSAGES.PREVIOUS_PAGE}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-md text-label-md text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={result?.last}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {STUDENT_ACADEMICIAN_MESSAGES.NEXT_PAGE}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
