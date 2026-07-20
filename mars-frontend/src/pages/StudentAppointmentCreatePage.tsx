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
  STUDENT_APPOINTMENT_CATEGORY_GROUP_LABELS,
  STUDENT_APPOINTMENT_MESSAGES,
  STUDENT_APPOINTMENT_STEP_CATEGORY,
  STUDENT_APPOINTMENT_STEP_COURSE,
} from '../constants/studentAppointment';
import { studentAcademicianProfilePath, ROUTES } from '../constants/routes';
import { STUDENT_UI } from '../constants/studentUi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getStudentAppointmentCategories } from '../services/studentAppointmentCategoryService';
import { getStudentAcademicianDetail } from '../services/studentAcademicianService';
import type { StudentAcademicianDetail } from '../types/studentAcademician';
import type {
  StudentAppointmentCategory,
  StudentAppointmentDraft,
} from '../types/studentAppointment';
import {
  loadStudentAppointmentDraft,
  saveStudentAppointmentDraft,
} from '../utils/studentAppointmentDraft';
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

function toDraft(category: StudentAppointmentCategory): StudentAppointmentDraft {
  return {
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    durationMinutes: category.durationMinutes,
    categoryGroup: category.categoryGroup,
    requiresCourseSelection: category.requiresCourseSelection,
    description: category.description,
  };
}

function CategoryStepPanel({
  categories,
  selectedCategoryId,
  loading,
  error,
  onRetry,
  onSelect,
  onContinue,
}: {
  categories: StudentAppointmentCategory[];
  selectedCategoryId: number | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (category: StudentAppointmentCategory) => void;
  onContinue: () => void;
}) {
  const canContinue = selectedCategoryId != null;

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2 className="font-headline-md text-headline-md text-primary">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_TITLE}
      </h2>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_DESCRIPTION}
      </p>

      <div className="mt-6">
        {loading ? (
          <StudentLoadingState
            label={STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_LOADING}
            compact
          />
        ) : error ? (
          <StudentErrorState message={error} onRetry={onRetry} />
        ) : categories.length === 0 ? (
          <StudentEmptyState
            icon="category"
            title={STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_EMPTY_TITLE}
            description={STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_EMPTY_DESCRIPTION}
            className="border-0 bg-surface px-4 py-8"
          />
        ) : (
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            role="radiogroup"
            aria-label={STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_TITLE}
          >
            {categories.map((category) => {
              const selected = selectedCategoryId === category.categoryId;
              const groupLabel =
                STUDENT_APPOINTMENT_CATEGORY_GROUP_LABELS[category.categoryGroup] ??
                category.categoryGroup;
              const description = category.description?.trim() || null;

              return (
                <button
                  key={category.categoryId}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(category)}
                  className={`flex min-w-0 flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2 ${
                    selected
                      ? 'border-primary bg-surface-container'
                      : 'border-outline-variant bg-surface hover:border-primary/60'
                  }`}
                >
                  <span className="font-body-md text-body-md font-semibold text-primary">
                    {category.categoryName}
                  </span>
                  {description ? (
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {description}
                    </span>
                  ) : (
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {groupLabel}
                    </span>
                  )}
                  <span className="mt-auto font-label-sm text-label-sm text-on-surface">
                    {STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_DURATION(
                      category.durationMinutes,
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-stretch sm:justify-end">
        <button
          type="button"
          className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
          disabled={!canContinue}
          title={canContinue ? undefined : STUDENT_APPOINTMENT_MESSAGES.CONTINUE_DISABLED}
          onClick={onContinue}
        >
          {STUDENT_APPOINTMENT_MESSAGES.CONTINUE}
        </button>
      </div>
    </section>
  );
}

function CourseStepPlaceholder({
  draft,
  onBack,
}: {
  draft: StudentAppointmentDraft;
  onBack: () => void;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2 className="font-headline-md text-headline-md text-primary">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_TITLE}
      </h2>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_DESCRIPTION}
      </p>
      <dl className="mt-4 space-y-2 rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-label-sm text-label-sm text-on-surface-variant">Kategori</dt>
          <dd className="font-body-md text-body-md text-on-surface">{draft.categoryName}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-label-sm text-label-sm text-on-surface-variant">Süre</dt>
          <dd className="font-body-md text-body-md text-on-surface">
            {STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_DURATION(draft.durationMinutes)}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex justify-stretch sm:justify-start">
        <button
          type="button"
          className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} w-full sm:w-auto`}
          onClick={onBack}
        >
          {STUDENT_APPOINTMENT_MESSAGES.BACK_TO_CATEGORY}
        </button>
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

  const [categories, setCategories] = useState<StudentAppointmentCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<StudentAppointmentDraft | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(STUDENT_APPOINTMENT_STEP_CATEGORY);

  const academicianId = Number(academicianIdParam);
  const profilePath =
    Number.isInteger(academicianId) && academicianId >= 1
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
      const draft = loadStudentAppointmentDraft(academicianId);
      setSelectedDraft(draft);
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

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await getStudentAppointmentCategories();
      setCategories(data);
      setSelectedDraft((current) => {
        if (!current) {
          return current;
        }
        const stillExists = data.some((item) => item.categoryId === current.categoryId);
        return stillExists ? current : null;
      });
    } catch (err) {
      const message = resolveStudentApiError(
        err,
        STUDENT_APPOINTMENT_MESSAGES.STEP_CATEGORY_LOAD_ERROR,
      );
      setCategories([]);
      setCategoriesError(message);
      toast.error(message);
    } finally {
      setCategoriesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAcademician();
  }, [loadAcademician]);

  useEffect(() => {
    if (academician?.isAcceptingAppointments) {
      void loadCategories();
    }
  }, [academician, loadCategories]);

  const handleSelectCategory = (category: StudentAppointmentCategory) => {
    const draft = toDraft(category);
    setSelectedDraft(draft);
    if (Number.isInteger(academicianId) && academicianId >= 1) {
      saveStudentAppointmentDraft(academicianId, draft);
    }
  };

  const handleContinue = () => {
    if (!selectedDraft) {
      return;
    }
    setActiveStepIndex(STUDENT_APPOINTMENT_STEP_COURSE);
  };

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
      <StudentAppointmentStepper activeStepIndex={activeStepIndex} />

      {activeStepIndex === STUDENT_APPOINTMENT_STEP_COURSE && selectedDraft ? (
        <CourseStepPlaceholder
          draft={selectedDraft}
          onBack={() => setActiveStepIndex(STUDENT_APPOINTMENT_STEP_CATEGORY)}
        />
      ) : (
        <CategoryStepPanel
          categories={categories}
          selectedCategoryId={selectedDraft?.categoryId ?? null}
          loading={categoriesLoading}
          error={categoriesError}
          onRetry={() => void loadCategories()}
          onSelect={handleSelectCategory}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
