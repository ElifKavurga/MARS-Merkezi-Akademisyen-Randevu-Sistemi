import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DepartmentSelect from '../components/DepartmentSelect';
import StudentAcceptingBadge from '../components/StudentAcceptingBadge';
import StudentBreadcrumb from '../components/StudentBreadcrumb';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import UserAvatar from '../components/UserAvatar';
import {
  STUDENT_ACADEMICIAN_MESSAGES,
  STUDENT_ACADEMICIAN_PAGE_SIZE,
} from '../constants/studentAcademician';
import { studentAcademicianProfilePath, ROUTES } from '../constants/routes';
import { STUDENT_UI } from '../constants/studentUi';
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
import { resolveStudentApiError } from '../utils/studentApiError';

type AppliedFilters = {
  search: string;
  departmentId?: number;
  academicTitle?: string;
  isAcceptingAppointments?: boolean;
  sort: StudentAcademicianSort;
};

function AcademicianCard({ academician }: { academician: StudentAcademician }) {
  return (
    <article
      className="flex h-full min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
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
            <h2 className="min-w-0 truncate font-headline-md text-body-lg text-primary">
              {academician.fullName}
            </h2>
            <StudentAcceptingBadge
              accepting={academician.isAcceptingAppointments}
              activeLabel={STUDENT_ACADEMICIAN_MESSAGES.STATUS_ACTIVE}
              inactiveLabel={STUDENT_ACADEMICIAN_MESSAGES.STATUS_INACTIVE}
            />
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
          className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} w-full`}
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
        const message = resolveStudentApiError(err, STUDENT_ACADEMICIAN_MESSAGES.LOAD_ERROR);
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
      <StudentBreadcrumb
        items={[
          { label: STUDENT_UI.BREADCRUMB_HOME, to: ROUTES.STUDENT },
          { label: STUDENT_UI.BREADCRUMB_SEARCH },
        ]}
      />
      <StudentPageHeader
        title={STUDENT_ACADEMICIAN_MESSAGES.TITLE}
        description={STUDENT_ACADEMICIAN_MESSAGES.SUBTITLE}
      />

      <section className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-6">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <div className="relative min-w-0">
            <label htmlFor="student-academician-search" className="sr-only">
              Ad, soyad veya bölüm ara
            </label>
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
              aria-hidden="true"
            >
              search
            </span>
            <input
              id="student-academician-search"
              type="search"
              className={`${FORM_FIELD_CLASS} pl-10`}
              placeholder={STUDENT_ACADEMICIAN_MESSAGES.SEARCH_PLACEHOLDER}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0">
              <label htmlFor="student-academician-department" className="sr-only">
                Bölüm filtresi
              </label>
              <DepartmentSelect
                id="student-academician-department"
                value={departmentId}
                onChange={setDepartmentId}
                allowEmpty
                emptyLabel={STUDENT_ACADEMICIAN_MESSAGES.DEPARTMENT_ALL}
                className={FORM_SELECT_CLASS}
              />
            </div>

            <div className="min-w-0">
              <label htmlFor="student-academician-title" className="sr-only">
                Akademik ünvan filtresi
              </label>
              <select
                id="student-academician-title"
                className={FORM_SELECT_CLASS}
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
            </div>

            <div className="min-w-0">
              <label htmlFor="student-academician-accepting" className="sr-only">
                Randevu kabul durumu filtresi
              </label>
              <select
                id="student-academician-accepting"
                className={FORM_SELECT_CLASS}
                value={acceptingFilter}
                onChange={(event) => setAcceptingFilter(event.target.value)}
              >
                <option value="">{STUDENT_ACADEMICIAN_MESSAGES.ACCEPTING_ALL}</option>
                <option value="true">{STUDENT_ACADEMICIAN_MESSAGES.ACCEPTING_ACTIVE}</option>
                <option value="false">{STUDENT_ACADEMICIAN_MESSAGES.ACCEPTING_INACTIVE}</option>
              </select>
            </div>

            <div className="min-w-0">
              <label htmlFor="student-academician-sort" className="sr-only">
                {STUDENT_ACADEMICIAN_MESSAGES.SORT_LABEL}
              </label>
              <select
                id="student-academician-sort"
                className={FORM_SELECT_CLASS}
                value={sortInput}
                onChange={(event) => setSortInput(event.target.value as StudentAcademicianSort)}
              >
                <option value="NAME_ASC">{STUDENT_ACADEMICIAN_MESSAGES.SORT_NAME_ASC}</option>
                <option value="NAME_DESC">{STUDENT_ACADEMICIAN_MESSAGES.SORT_NAME_DESC}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-stretch sm:justify-end">
            <button type="submit" className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}>
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
        <StudentLoadingState label={STUDENT_ACADEMICIAN_MESSAGES.LOADING} />
      ) : error ? (
        <StudentErrorState
          message={error}
          onRetry={() => void loadAcademicians(applied, page)}
        />
      ) : academicians.length === 0 ? (
        <StudentEmptyState
          icon="person_search"
          title={STUDENT_ACADEMICIAN_MESSAGES.EMPTY_TITLE}
          description={STUDENT_ACADEMICIAN_MESSAGES.EMPTY_DESCRIPTION}
        />
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
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button
                  type="button"
                  className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} flex-1 sm:flex-none`}
                  disabled={result?.first}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  {STUDENT_ACADEMICIAN_MESSAGES.PREVIOUS_PAGE}
                </button>
                <button
                  type="button"
                  className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} flex-1 sm:flex-none`}
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
