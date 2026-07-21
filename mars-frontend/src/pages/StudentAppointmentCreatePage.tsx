import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppointmentStepper from '../components/StudentAppointmentStepper';
import StudentBackLink from '../components/StudentBackLink';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import UserAvatar from '../components/UserAvatar';
import { getMeetingTypeLabel } from '../constants/appointment';
import {
  APPOINTMENT_MEETING_TYPE_OPTIONS,
  MEETING_TYPE,
} from '../constants/availability';
import {
  STUDENT_APPOINTMENT_CATEGORY_GROUP_LABELS,
  STUDENT_APPOINTMENT_MESSAGES,
  STUDENT_APPOINTMENT_STEP_CATEGORY,
  STUDENT_APPOINTMENT_STEP_CONFIRM,
  STUDENT_APPOINTMENT_STEP_COURSE,
  STUDENT_APPOINTMENT_STEP_MEETING_TYPE,
  STUDENT_APPOINTMENT_STEP_SLOT,
  STUDENT_APPOINTMENT_STEPS,
  STUDENT_POST_APPOINTMENT_REDIRECT,
} from '../constants/studentAppointment';
import { studentAcademicianProfilePath, ROUTES } from '../constants/routes';
import { STUDENT_UI } from '../constants/studentUi';
import { useAuth } from '../hooks/useAuth';
import { toLocalIsoDate } from '../constants/calendar';
import { useToast } from '../hooks/useToast';
import { getStudentAppointmentCategories } from '../services/studentAppointmentCategoryService';
import {
  getStudentAcademicianAvailableSlots,
  getStudentAcademicianCourses,
  getStudentAcademicianDetail,
} from '../services/studentAcademicianService';
import { createStudentAppointment } from '../services/studentAppointmentService';
import type { StudentAcademicianCourse, StudentAcademicianDetail } from '../types/studentAcademician';
import type {
  StudentAppointmentCategory,
  StudentAppointmentDraft,
  StudentAvailableSlot,
} from '../types/studentAppointment';
import {
  clearStudentAppointmentDraft,
  loadStudentAppointmentDraft,
  saveStudentAppointmentDraft,
} from '../utils/studentAppointmentDraft';
import { handleRadiogroupKeyDown } from '../utils/studentRadiogroupKeyboard';
import {
  isStudentApiNotFound,
  resolveStudentApiError,
} from '../utils/studentApiError';

const CLEARED_SLOT_FIELDS = {
  slotId: null,
  slotDate: null,
  startTime: null,
  endTime: null,
  slotMeetingType: null,
  meetingType: null,
} as const;

function slotSelectionKey(
  slot: Pick<StudentAvailableSlot, 'slotId' | 'slotDate' | 'startTime'>,
): string {
  return `${slot.slotId}|${slot.slotDate}|${slot.startTime}`;
}

function formatSlotDateLabel(slotDate: string): string {
  return new Date(`${slotDate}T00:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatSlotTime(time: string): string {
  return time.slice(0, 5);
}

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

function categoryToDraft(category: StudentAppointmentCategory): StudentAppointmentDraft {
  return {
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    durationMinutes: category.durationMinutes,
    categoryGroup: category.categoryGroup,
    requiresCourseSelection: category.requiresCourseSelection,
    description: category.description,
    courseId: null,
    courseCode: null,
    courseName: null,
    ...CLEARED_SLOT_FIELDS,
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

function CourseStepPanel({
  courses,
  selectedCourseId,
  loading,
  error,
  onRetry,
  onSelect,
  onContinue,
  onBack,
}: {
  courses: StudentAcademicianCourse[];
  selectedCourseId: number | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (course: StudentAcademicianCourse) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const canContinue = selectedCourseId != null;

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2 className="font-headline-md text-headline-md text-primary">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_TITLE}
      </h2>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_DESCRIPTION}
      </p>

      <div className="mt-6">
        {loading ? (
          <StudentLoadingState
            label={STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_LOADING}
            compact
          />
        ) : error ? (
          <StudentErrorState message={error} onRetry={onRetry} />
        ) : courses.length === 0 ? (
          <StudentEmptyState
            icon="menu_book"
            title={STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_EMPTY_TITLE}
            description={STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_EMPTY_DESCRIPTION}
            className="border-0 bg-surface px-4 py-8"
          />
        ) : (
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            role="radiogroup"
            aria-label={STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_TITLE}
          >
            {courses.map((course) => {
              const selected = selectedCourseId === course.courseId;
              return (
                <button
                  key={course.courseId}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(course)}
                  className={`flex min-w-0 flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2 ${
                    selected
                      ? 'border-primary bg-surface-container'
                      : 'border-outline-variant bg-surface hover:border-primary/60'
                  }`}
                >
                  <span className="font-body-md text-body-md font-semibold text-primary">
                    {course.courseCode}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {course.courseName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} w-full sm:w-auto`}
          onClick={onBack}
        >
          {STUDENT_APPOINTMENT_MESSAGES.BACK_TO_CATEGORY}
        </button>
        <button
          type="button"
          className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
          disabled={!canContinue}
          title={
            canContinue ? undefined : STUDENT_APPOINTMENT_MESSAGES.CONTINUE_COURSE_DISABLED
          }
          onClick={onContinue}
        >
          {STUDENT_APPOINTMENT_MESSAGES.CONTINUE}
        </button>
      </div>
    </section>
  );
}

function SlotStepPanel({
  slots,
  selectedKey,
  loading,
  error,
  durationMinutes,
  requiresCourseSelection,
  onRetry,
  onSelect,
  onContinue,
  onBack,
}: {
  slots: StudentAvailableSlot[];
  selectedKey: string | null;
  loading: boolean;
  error: string | null;
  durationMinutes: number;
  requiresCourseSelection: boolean;
  onRetry: () => void;
  onSelect: (slot: StudentAvailableSlot) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const canContinue = slots.some(
    (slot) => !slot.isBooked && slotSelectionKey(slot) === selectedKey,
  );

  const groupedSlots = useMemo(() => {
    const byDate = new Map<string, StudentAvailableSlot[]>();
    for (const slot of slots) {
      const list = byDate.get(slot.slotDate) ?? [];
      list.push(slot);
      byDate.set(slot.slotDate, list);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dateSlots]) => ({
        date,
        slots: [...dateSlots].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }));
  }, [slots]);

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2 className="font-headline-md text-headline-md text-primary">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_TITLE}
      </h2>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_DESCRIPTION}
      </p>

      <div className="mt-5">
        {loading ? (
          <StudentLoadingState
            label={STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_LOADING}
            compact
          />
        ) : error ? (
          <StudentErrorState message={error} onRetry={onRetry} />
        ) : slots.length === 0 ? (
          <StudentEmptyState
            icon="event_busy"
            title={STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_EMPTY_TITLE}
            description={STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_EMPTY_DESCRIPTION}
            className="border-0 bg-surface px-4 py-8"
          />
        ) : (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
            role="radiogroup"
            aria-label={STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_TITLE}
          >
            {groupedSlots.map((group) => (
              <div
                key={group.date}
                className="min-w-0 rounded-lg border border-outline-variant/80 bg-surface px-3 py-3"
              >
                <h3 className="mb-2 font-label-md text-label-md font-semibold text-on-surface">
                  {formatSlotDateLabel(group.date)}
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {group.slots.map((slot) => {
                    const key = slotSelectionKey(slot);
                    const selected = selectedKey === key;
                    const isBooked = slot.isBooked === true;

                    if (isBooked) {
                      return (
                        <div
                          key={key}
                          aria-disabled="true"
                          className="relative flex min-w-0 flex-col gap-1 rounded-xl border border-outline-variant/60 bg-neutral-100 p-3 text-left opacity-60 cursor-not-allowed select-none transition-all duration-200"
                        >
                          <div className="flex w-full items-center justify-between gap-1.5">
                            <span className="font-body-md text-body-md font-bold text-neutral-400 line-through">
                              {formatSlotTime(slot.startTime)}
                            </span>
                            <span
                              className="material-symbols-outlined text-[16px] text-neutral-400 shrink-0 select-none"
                              aria-hidden="true"
                            >
                              lock
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-label-sm text-[12px] text-neutral-400">
                              {STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_DURATION(durationMinutes)}
                              {' · '}
                              {getMeetingTypeLabel(slot.meetingType)}
                            </span>
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-neutral-200 px-1.5 py-0.5 font-label-sm text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                              Dolu
                            </span>
                          </div>
                          <span className="sr-only">
                            {formatSlotTime(slot.startTime)} - Dolu. Bu saat başka bir öğrenci tarafından rezerve edilmiştir.
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onSelect(slot)}
                        className={`flex min-w-0 w-full flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-1 cursor-pointer hover:scale-[1.02] ${
                          selected
                            ? 'border-2 border-primary bg-primary-fixed text-on-primary-fixed shadow-sm scale-[1.02]'
                            : 'border border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-1.5">
                          <span
                            className={`font-body-md text-body-md font-semibold ${
                              selected ? 'text-on-primary-fixed' : 'text-on-surface'
                            }`}
                          >
                            {formatSlotTime(slot.startTime)}
                          </span>
                          <span
                            className={`material-symbols-outlined text-[16px] shrink-0 select-none ${
                              selected ? 'text-on-primary-fixed' : 'text-primary'
                            }`}
                            aria-hidden="true"
                          >
                            event_available
                          </span>
                        </div>
                        <span
                          className={`font-label-sm text-label-sm ${
                            selected ? 'text-on-primary-fixed-variant' : 'text-on-surface-variant'
                          }`}
                        >
                          {STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_DURATION(durationMinutes)}
                          {' · '}
                          {getMeetingTypeLabel(slot.meetingType)}
                        </span>
                        <span className="sr-only">
                          {formatSlotTime(slot.startTime)} - Müsait. Randevu almak için tıklayın.
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} w-full sm:w-auto`}
          onClick={onBack}
        >
          {requiresCourseSelection
            ? STUDENT_APPOINTMENT_MESSAGES.BACK_TO_COURSE
            : STUDENT_APPOINTMENT_MESSAGES.BACK_TO_CATEGORY}
        </button>
        <button
          type="button"
          className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
          disabled={!canContinue}
          title={canContinue ? undefined : STUDENT_APPOINTMENT_MESSAGES.CONTINUE_SLOT_DISABLED}
          onClick={onContinue}
        >
          {STUDENT_APPOINTMENT_MESSAGES.CONTINUE}
        </button>
      </div>
    </section>
  );
}

function isSelectableMeetingType(meetingType: string | null | undefined): boolean {
  return meetingType === MEETING_TYPE.FACE_TO_FACE || meetingType === MEETING_TYPE.ONLINE;
}

function isDraftReadyToSubmit(draft: StudentAppointmentDraft | null): boolean {
  if (!draft?.categoryId || !draft.slotId || !isSelectableMeetingType(draft.meetingType)) {
    return false;
  }
  if (draft.requiresCourseSelection && (draft.courseId == null || draft.courseId < 1)) {
    return false;
  }
  return true;
}

/** Yenileme sonrası draft’tan adım geri yükleme. */
function resolveStepFromDraft(draft: StudentAppointmentDraft): number {
  if (draft.requiresCourseSelection && (draft.courseId == null || draft.courseId < 1)) {
    return STUDENT_APPOINTMENT_STEP_COURSE;
  }
  if (!draft.slotId || !draft.slotDate || !draft.startTime) {
    return STUDENT_APPOINTMENT_STEP_SLOT;
  }
  if (!isSelectableMeetingType(draft.meetingType)) {
    return STUDENT_APPOINTMENT_STEP_MEETING_TYPE;
  }
  return STUDENT_APPOINTMENT_STEP_CONFIRM;
}

function MeetingTypeStepPanel({
  draft,
  onSelectMeetingType,
  onContinue,
  onBack,
}: {
  draft: StudentAppointmentDraft;
  onSelectMeetingType: (meetingType: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const canContinue = isSelectableMeetingType(draft.meetingType);
  const showChooser =
    draft.slotMeetingType === MEETING_TYPE.BOTH
    || draft.meetingType === MEETING_TYPE.BOTH
    || !isSelectableMeetingType(draft.meetingType);

  const selectedOptionIndex = APPOINTMENT_MEETING_TYPE_OPTIONS.findIndex(
    (option) => option.value === draft.meetingType,
  );

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2
        tabIndex={-1}
        className="font-headline-md text-headline-md text-primary outline-none"
      >
        {STUDENT_APPOINTMENT_MESSAGES.STEP_MEETING_TYPE_TITLE}
      </h2>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_MEETING_TYPE_DESCRIPTION}
      </p>

      {showChooser ? (
        <div
          className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
          role="radiogroup"
          aria-label={STUDENT_APPOINTMENT_MESSAGES.STEP_MEETING_TYPE_TITLE}
          onKeyDown={(event) =>
            handleRadiogroupKeyDown(
              event,
              APPOINTMENT_MEETING_TYPE_OPTIONS.length,
              selectedOptionIndex,
              (index) => onSelectMeetingType(APPOINTMENT_MEETING_TYPE_OPTIONS[index].value),
            )
          }
        >
          {APPOINTMENT_MEETING_TYPE_OPTIONS.map((option, index) => {
            const selected = draft.meetingType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected || (selectedOptionIndex < 0 && index === 0) ? 0 : -1}
                onClick={() => onSelectMeetingType(option.value)}
                className={`rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-1 ${
                  selected
                    ? 'border-2 border-primary bg-primary-fixed text-on-primary-fixed'
                    : 'border-outline-variant bg-surface hover:border-primary hover:bg-surface-container'
                }`}
              >
                <span className="font-body-md text-body-md font-semibold">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-md text-body-md text-on-surface">
          {getMeetingTypeLabel(draft.meetingType ?? '')}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} w-full sm:w-auto`}
          onClick={onBack}
        >
          {STUDENT_APPOINTMENT_MESSAGES.BACK_TO_SLOT}
        </button>
        <button
          type="button"
          className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
          disabled={!canContinue}
          aria-disabled={!canContinue}
          title={
            canContinue
              ? undefined
              : STUDENT_APPOINTMENT_MESSAGES.CONTINUE_MEETING_TYPE_DISABLED
          }
          onClick={onContinue}
        >
          {STUDENT_APPOINTMENT_MESSAGES.CONTINUE}
        </button>
      </div>
    </section>
  );
}

function ConfirmStepPanel({
  academician,
  draft,
  submitting,
  onBack,
  onConfirm,
}: {
  academician: StudentAcademicianDetail;
  draft: StudentAppointmentDraft;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const canSubmit = isDraftReadyToSubmit(draft) && !submitting;
  const timeLabel =
    draft.startTime && draft.endTime
      ? `${formatSlotTime(draft.startTime)} – ${formatSlotTime(draft.endTime)}`
      : '—';

  const rows: { label: string; value: string }[] = [
    {
      label: STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_ACADEMICIAN,
      value: academician.fullName,
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_TITLE_LABEL,
      value: academician.academicTitle?.trim()
        ? academician.academicTitle
        : STUDENT_APPOINTMENT_MESSAGES.NO_TITLE,
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_DEPARTMENT,
      value: academician.departmentName,
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_CATEGORY,
      value: draft.categoryName,
    },
  ];

  if (draft.requiresCourseSelection || draft.courseId != null) {
    rows.push({
      label: STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_COURSE,
      value:
        draft.courseId != null && draft.courseCode
          ? `${draft.courseCode} — ${draft.courseName ?? ''}`
          : '—',
    });
  }

  rows.push(
    {
      label: STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_DATE,
      value: draft.slotDate ? formatSlotDateLabel(draft.slotDate) : '—',
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_TIME,
      value: timeLabel,
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_DURATION,
      value: STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_DURATION(draft.durationMinutes),
    },
    {
      label: STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_MEETING_TYPE,
      value: draft.meetingType ? getMeetingTypeLabel(draft.meetingType) : '—',
    },
  );

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2 className="font-headline-md text-headline-md text-primary">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_TITLE}
      </h2>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        {STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_DESCRIPTION}
      </p>

      <dl className="mt-5 space-y-3 rounded-lg border border-outline-variant bg-surface p-4">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap justify-between gap-2">
            <dt className="font-label-sm text-label-sm text-on-surface-variant">{row.label}</dt>
            <dd className="max-w-full text-right font-body-md text-body-md text-on-surface">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} w-full sm:w-auto`}
          disabled={submitting}
          onClick={onBack}
        >
          {STUDENT_APPOINTMENT_MESSAGES.BACK_TO_MEETING_TYPE}
        </button>
        <button
          type="button"
          className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
          disabled={!canSubmit}
          title={
            canSubmit ? undefined : STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_DISABLED
          }
          onClick={onConfirm}
        >
          {submitting
            ? STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_SUBMITTING
            : STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_SUBMIT}
        </button>
      </div>
    </section>
  );
}

export default function StudentAppointmentCreatePage() {
  const { academicianId: academicianIdParam } = useParams<{ academicianId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [academician, setAcademician] = useState<StudentAcademicianDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [categories, setCategories] = useState<StudentAppointmentCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [courses, setCourses] = useState<StudentAcademicianCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [slots, setSlots] = useState<StudentAvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<StudentAppointmentDraft | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(STUDENT_APPOINTMENT_STEP_CATEGORY);
  const [submitting, setSubmitting] = useState(false);
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const academicianId = Number(academicianIdParam);
  const profilePath =
    Number.isInteger(academicianId) && academicianId >= 1
      ? studentAcademicianProfilePath(academicianId)
      : ROUTES.STUDENT_ACADEMICIAN_SEARCH;

  const persistDraft = useCallback(
    (draft: StudentAppointmentDraft) => {
      setSelectedDraft(draft);
      if (Number.isInteger(academicianId) && academicianId >= 1) {
        saveStudentAppointmentDraft(academicianId, draft);
      }
    },
    [academicianId],
  );

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
      const restoredDraft = loadStudentAppointmentDraft(academicianId);
      setSelectedDraft(restoredDraft);
      if (restoredDraft) {
        setActiveStepIndex(resolveStepFromDraft(restoredDraft));
      } else {
        setActiveStepIndex(STUDENT_APPOINTMENT_STEP_CATEGORY);
      }
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
        if (stillExists) {
          return current;
        }
        if (Number.isInteger(academicianId) && academicianId >= 1) {
          clearStudentAppointmentDraft(academicianId);
        }
        return null;
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
  }, [toast, academicianId]);

  const loadCourses = useCallback(async () => {
    if (!Number.isInteger(academicianId) || academicianId < 1) {
      return;
    }
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const data = await getStudentAcademicianCourses(academicianId);
      setCourses(data);
      setSelectedDraft((current) => {
        if (!current?.courseId) {
          return current;
        }
        const stillExists = data.some((item) => item.courseId === current.courseId);
        if (stillExists) {
          return current;
        }
        const cleared = {
          ...current,
          courseId: null,
          courseCode: null,
          courseName: null,
        };
        saveStudentAppointmentDraft(academicianId, cleared);
        return cleared;
      });
    } catch (err) {
      const message = resolveStudentApiError(
        err,
        STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_LOAD_ERROR,
      );
      setCourses([]);
      setCoursesError(message);
      toast.error(message);
    } finally {
      setCoursesLoading(false);
    }
  }, [academicianId, toast]);

  const loadSlots = useCallback(async () => {
    if (!Number.isInteger(academicianId) || academicianId < 1 || !selectedDraft?.categoryId) {
      return;
    }
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const data = await getStudentAcademicianAvailableSlots(academicianId, {
        categoryId: selectedDraft.categoryId,
        courseId: selectedDraft.courseId,
      });
      const nextSlots = Array.isArray(data) ? data : [];
      const todayStr = toLocalIsoDate(new Date());
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 14);
      const maxDateStr = toLocalIsoDate(maxDate);
      const filteredSlots = nextSlots.filter(
        (slot) => slot.slotDate >= todayStr && slot.slotDate <= maxDateStr,
      );
      setSlots(filteredSlots);
      setSelectedDraft((current) => {
        if (!current?.slotId || !current.slotDate || !current.startTime) {
          return current;
        }
        const stillExists = filteredSlots.some(
          (item) =>
            item.slotId === current.slotId
            && item.slotDate === current.slotDate
            && item.startTime === current.startTime,
        );
        if (stillExists) {
          return current;
        }
        const cleared = { ...current, ...CLEARED_SLOT_FIELDS };
        saveStudentAppointmentDraft(academicianId, cleared);
        return cleared;
      });
    } catch (err) {
      const message = resolveStudentApiError(
        err,
        STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_LOAD_ERROR,
      );
      setSlots([]);
      setSlotsError(message);
      toast.error(message);
    } finally {
      setSlotsLoading(false);
    }
  }, [academicianId, selectedDraft?.categoryId, selectedDraft?.courseId, toast]);

  useEffect(() => {
    void loadAcademician();
  }, [loadAcademician]);

  useEffect(() => {
    if (academician?.isAcceptingAppointments) {
      void loadCategories();
    }
  }, [academician, loadCategories]);

  useEffect(() => {
    if (
      academician?.isAcceptingAppointments &&
      activeStepIndex === STUDENT_APPOINTMENT_STEP_COURSE &&
      selectedDraft?.requiresCourseSelection
    ) {
      void loadCourses();
    }
  }, [academician, activeStepIndex, selectedDraft?.requiresCourseSelection, loadCourses]);

  useEffect(() => {
    if (
      academician?.isAcceptingAppointments &&
      activeStepIndex === STUDENT_APPOINTMENT_STEP_SLOT &&
      selectedDraft?.categoryId
    ) {
      void loadSlots();
    }
  }, [academician, activeStepIndex, selectedDraft?.categoryId, loadSlots]);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [activeStepIndex]);

  const skippedStepIndices = useMemo(() => {
    if (
      selectedDraft &&
      !selectedDraft.requiresCourseSelection &&
      activeStepIndex > STUDENT_APPOINTMENT_STEP_COURSE
    ) {
      return [STUDENT_APPOINTMENT_STEP_COURSE];
    }
    return [];
  }, [selectedDraft, activeStepIndex]);

  const handleSelectCategory = (category: StudentAppointmentCategory) => {
    persistDraft(categoryToDraft(category));
  };

  const handleContinueFromCategory = () => {
    if (!selectedDraft) {
      return;
    }
    if (selectedDraft.requiresCourseSelection) {
      setActiveStepIndex(STUDENT_APPOINTMENT_STEP_COURSE);
      return;
    }
    setActiveStepIndex(STUDENT_APPOINTMENT_STEP_SLOT);
  };

  const handleSelectCourse = (course: StudentAcademicianCourse) => {
    if (!selectedDraft) {
      return;
    }
    const courseChanged = selectedDraft.courseId !== course.courseId;
    persistDraft({
      ...selectedDraft,
      courseId: course.courseId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      ...(courseChanged ? CLEARED_SLOT_FIELDS : {}),
    });
  };

  const handleContinueFromCourse = () => {
    if (!selectedDraft?.courseId) {
      return;
    }
    setActiveStepIndex(STUDENT_APPOINTMENT_STEP_SLOT);
  };

  const handleSelectSlot = (slot: StudentAvailableSlot) => {
    if (!selectedDraft) {
      return;
    }
    persistDraft({
      ...selectedDraft,
      slotId: slot.slotId,
      slotDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotMeetingType: slot.meetingType,
      meetingType: slot.meetingType,
    });
  };

  const handleContinueFromSlot = () => {
    if (!selectedDraft?.slotId || !selectedDraft.slotDate || !selectedDraft.startTime) {
      return;
    }
    setActiveStepIndex(STUDENT_APPOINTMENT_STEP_MEETING_TYPE);
  };

  const handleBackFromSlot = () => {
    if (selectedDraft?.requiresCourseSelection) {
      setActiveStepIndex(STUDENT_APPOINTMENT_STEP_COURSE);
      return;
    }
    setActiveStepIndex(STUDENT_APPOINTMENT_STEP_CATEGORY);
  };

  const handleSelectMeetingType = (meetingType: string) => {
    if (!selectedDraft) {
      return;
    }
    persistDraft({
      ...selectedDraft,
      meetingType,
    });
  };

  const handleContinueFromMeetingType = () => {
    if (!isSelectableMeetingType(selectedDraft?.meetingType)) {
      return;
    }
    setActiveStepIndex(STUDENT_APPOINTMENT_STEP_CONFIRM);
  };

  const handleBackFromMeetingType = () => {
    setActiveStepIndex(STUDENT_APPOINTMENT_STEP_SLOT);
  };

  const handleBackFromConfirm = () => {
    setActiveStepIndex(STUDENT_APPOINTMENT_STEP_MEETING_TYPE);
  };

  const handleConfirmAppointment = async () => {
    if (!selectedDraft || submitting || !isDraftReadyToSubmit(selectedDraft)) {
      return;
    }

    setSubmitting(true);
    try {
      await createStudentAppointment({
        slotId: selectedDraft.slotId!,
        categoryId: selectedDraft.categoryId,
        courseId: selectedDraft.requiresCourseSelection ? selectedDraft.courseId : undefined,
        meetingType: selectedDraft.meetingType,
        appointmentDate: selectedDraft.slotDate,
        startTime: selectedDraft.startTime,
        endTime: selectedDraft.endTime,
      });
      if (Number.isInteger(academicianId) && academicianId >= 1) {
        clearStudentAppointmentDraft(academicianId);
      }
      setSelectedDraft(null);
      toast.success(STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_SUCCESS);
      navigate(STUDENT_POST_APPOINTMENT_REDIRECT, { replace: true });
    } catch (err) {
      const message = resolveStudentApiError(
        err,
        STUDENT_APPOINTMENT_MESSAGES.STEP_CONFIRM_ERROR,
      );
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }


  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
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

  const selectedSlotKey =
    selectedDraft?.slotId != null && selectedDraft.slotDate && selectedDraft.startTime
      ? slotSelectionKey({
          slotId: selectedDraft.slotId,
          slotDate: selectedDraft.slotDate,
          startTime: selectedDraft.startTime,
        })
      : null;

  return (
    <div className="w-full min-w-0 animate-fade-in">
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
      <StudentAppointmentStepper
        activeStepIndex={activeStepIndex}
        skippedStepIndices={skippedStepIndices}
      />

      <p
        ref={stepHeadingRef}
        tabIndex={-1}
        className="sr-only outline-none"
      >
        {STUDENT_APPOINTMENT_STEPS[activeStepIndex]?.label ?? ''} adımı
      </p>

      {activeStepIndex === STUDENT_APPOINTMENT_STEP_CONFIRM && selectedDraft ? (
        <ConfirmStepPanel
          academician={academician}
          draft={selectedDraft}
          submitting={submitting}
          onBack={handleBackFromConfirm}
          onConfirm={() => void handleConfirmAppointment()}
        />
      ) : activeStepIndex === STUDENT_APPOINTMENT_STEP_MEETING_TYPE && selectedDraft ? (
        <MeetingTypeStepPanel
          draft={selectedDraft}
          onSelectMeetingType={handleSelectMeetingType}
          onContinue={handleContinueFromMeetingType}
          onBack={handleBackFromMeetingType}
        />
      ) : activeStepIndex === STUDENT_APPOINTMENT_STEP_SLOT && selectedDraft ? (
        <SlotStepPanel
          slots={slots}
          selectedKey={selectedSlotKey}
          loading={slotsLoading}
          error={slotsError}
          durationMinutes={selectedDraft.durationMinutes}
          requiresCourseSelection={selectedDraft.requiresCourseSelection}
          onRetry={() => void loadSlots()}
          onSelect={handleSelectSlot}
          onContinue={handleContinueFromSlot}
          onBack={handleBackFromSlot}
        />
      ) : activeStepIndex === STUDENT_APPOINTMENT_STEP_COURSE && selectedDraft ? (
        <CourseStepPanel
          courses={courses}
          selectedCourseId={selectedDraft.courseId}
          loading={coursesLoading}
          error={coursesError}
          onRetry={() => void loadCourses()}
          onSelect={handleSelectCourse}
          onContinue={handleContinueFromCourse}
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
          onContinue={handleContinueFromCategory}
        />
      )}
    </div>
  );
}
