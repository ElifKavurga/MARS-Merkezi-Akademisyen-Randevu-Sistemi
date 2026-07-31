import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DepartmentSelect from '../components/DepartmentSelect';
import StudentAcceptingBadge from '../components/StudentAcceptingBadge';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import UserAvatar from '../components/UserAvatar';
import {
  STUDENT_ACADEMICIAN_MESSAGES,
  STUDENT_ACADEMICIAN_PAGE_SIZE,
} from '../constants/studentAcademician';
import { studentAcademicianProfilePath } from '../constants/routes';
import { STUDENT_UI } from '../constants/studentUi';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants/ui';
import { useAuth } from '../hooks/useAuth';
import { useDepartments } from '../hooks/useDepartments';
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
      className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest p-3"
      data-academician-id={academician.userId}
    >
      <div className="flex items-start gap-3">
        <UserAvatar fullName={academician.fullName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <h2 className="min-w-0 break-words font-headline-md text-body-md text-primary">
              {academician.fullName}
            </h2>
            <StudentAcceptingBadge
              accepting={academician.isAcceptingAppointments}
              activeLabel={STUDENT_ACADEMICIAN_MESSAGES.STATUS_ACCEPTING}
              inactiveLabel={STUDENT_ACADEMICIAN_MESSAGES.STATUS_NOT_ACCEPTING}
            />
          </div>
          <p className="mt-0.5 break-words font-label-sm text-label-sm text-on-surface-variant">
            {academician.academicTitle?.trim()
              ? academician.academicTitle
              : STUDENT_ACADEMICIAN_MESSAGES.NO_TITLE}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-1.5 border-t border-outline-variant pt-2">
        <div className="flex min-w-0 items-start gap-2">
          <dt className="sr-only">{STUDENT_ACADEMICIAN_MESSAGES.DEPARTMENT_FIELD}</dt>
          <dd className="flex min-w-0 items-start gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
              apartment
            </span>
            <span className="min-w-0 break-words leading-snug">{academician.departmentName}</span>
          </dd>
        </div>
        <div className="flex min-w-0 items-start gap-2">
          <dt className="sr-only">{STUDENT_ACADEMICIAN_MESSAGES.EMAIL_FIELD}</dt>
          <dd className="flex min-w-0 items-start gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
              mail
            </span>
            <span className="min-w-0 break-all leading-snug">{academician.institutionalEmail}</span>
          </dd>
        </div>
      </dl>

      <div className="pt-1">
        <Link
          to={studentAcademicianProfilePath(academician.userId)}
          className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} min-h-9 w-full py-2`}
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
  const { user } = useAuth();
  const { departments, loading: departmentsLoading } = useDepartments();
  const [searchInput, setSearchInput] = useState('');
  const [departmentId, setDepartmentId] = useState(0);
  const [academicTitle, setAcademicTitle] = useState('');
  const [acceptingFilter, setAcceptingFilter] = useState('');
  const [sortInput, setSortInput] = useState<StudentAcademicianSort>('NAME_ASC');
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [applied, setApplied] = useState<AppliedFilters | null>(null);
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
      } catch (err) {
        if (!cancelled) {
          setTitleOptions([]);
          toast.error(
            resolveStudentApiError(err, STUDENT_ACADEMICIAN_MESSAGES.TITLES_LOAD_ERROR),
          );
        }
      }
    };
    void loadTitles();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    if (applied || departmentsLoading) {
      return;
    }

    const normalizedUserDepartment = user?.department?.trim().toLocaleLowerCase('tr-TR');
    const matchedDepartment = normalizedUserDepartment
      ? departments.find((department) =>
          department.departmentName.trim().toLocaleLowerCase('tr-TR') === normalizedUserDepartment)
      : undefined;
    const initialDepartmentId = matchedDepartment?.departmentId ?? 0;

    setDepartmentId(initialDepartmentId);
    setApplied({
      search: '',
      departmentId: initialDepartmentId > 0 ? initialDepartmentId : undefined,
      sort: 'NAME_ASC',
    });
  }, [applied, departments, departmentsLoading, user?.department]);

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
    if (!applied) {
      return;
    }
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
      <StudentPageHeader
        title={STUDENT_ACADEMICIAN_MESSAGES.TITLE}
        description={STUDENT_ACADEMICIAN_MESSAGES.SUBTITLE}
      />

      <section className="mb-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <div className="relative min-w-0">
            <label htmlFor="student-academician-search" className="sr-only">
              {STUDENT_ACADEMICIAN_MESSAGES.SEARCH_LABEL}
            </label>
            <svg
              className="pointer-events-none absolute left-3 h-5 w-5 text-on-surface-variant"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" />
            </svg>
            <input
              id="student-academician-search"
              type="search"
              className={`${FORM_FIELD_CLASS} pl-10`}
              placeholder={STUDENT_ACADEMICIAN_MESSAGES.SEARCH_PLACEHOLDER}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0">
              <label htmlFor="student-academician-department" className="sr-only">
                {STUDENT_ACADEMICIAN_MESSAGES.DEPARTMENT_FILTER_LABEL}
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
                {STUDENT_ACADEMICIAN_MESSAGES.TITLE_FILTER_LABEL}
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
                {STUDENT_ACADEMICIAN_MESSAGES.ACCEPTING_FILTER_LABEL}
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

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
          onRetry={applied ? () => void loadAcademicians(applied, page) : undefined}
        />
      ) : academicians.length === 0 ? (
        <StudentEmptyState
          icon="person_search"
          title={STUDENT_ACADEMICIAN_MESSAGES.EMPTY_TITLE}
          description={STUDENT_ACADEMICIAN_MESSAGES.EMPTY_DESCRIPTION}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {academicians.map((academician) => (
              <AcademicianCard key={academician.userId} academician={academician} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
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
