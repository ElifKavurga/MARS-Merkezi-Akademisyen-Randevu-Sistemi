import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import StudentAppointmentCard from '../components/StudentAppointmentCard';
import StudentAppointmentsCalendar from '../components/StudentAppointmentsCalendar';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import StudentSegmentedTabs from '../components/StudentSegmentedTabs';

import { APPOINTMENT_STATUS_LABELS, getMeetingTypeLabel } from '../constants/appointment';
import { MEETING_TYPE } from '../constants/availability';
import { studentAppointmentDetailPath } from '../constants/routes';
import { STUDENT_APPOINTMENT_MESSAGES } from '../constants/studentAppointment';
import { STUDENT_UI } from '../constants/studentUi';
import { useToast } from '../hooks/useToast';
import {
  cancelStudentAppointment,
  getStudentActiveAppointments,
  getStudentPastAppointments,
} from '../services/studentAppointmentService';
import type { StudentAppointmentListItem } from '../types/studentAppointment';
import { resolveStudentApiError } from '../utils/studentApiError';
import {
  DEFAULT_STUDENT_APPOINTMENT_FILTERS,
  filterAndSortStudentAppointments,
  hasActiveStudentAppointmentFilters,
  type StudentAppointmentListFilters,
  type StudentAppointmentSort,
} from '../utils/studentAppointmentListFilters';

type AppointmentTab = 'active' | 'past';
type AppointmentViewMode = 'list' | 'calendar';

const TAB_OPTIONS = [
  { value: 'active' as const, label: STUDENT_APPOINTMENT_MESSAGES.TAB_ACTIVE },
  { value: 'past' as const, label: STUDENT_APPOINTMENT_MESSAGES.TAB_PAST },
];

const VIEW_OPTIONS = [
  { value: 'list' as const, label: STUDENT_APPOINTMENT_MESSAGES.VIEW_LIST },
  { value: 'calendar' as const, label: STUDENT_APPOINTMENT_MESSAGES.VIEW_CALENDAR },
];

const ACTIVE_STATUS_OPTIONS = ['PENDING', 'APPROVED'] as const;
const PAST_STATUS_OPTIONS = ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'] as const;

const SORT_OPTIONS: { value: StudentAppointmentSort; label: string }[] = [
  { value: 'DATE_ASC', label: STUDENT_APPOINTMENT_MESSAGES.SORT_DATE_ASC },
  { value: 'DATE_DESC', label: STUDENT_APPOINTMENT_MESSAGES.SORT_DATE_DESC },
  { value: 'CREATED_DESC', label: STUDENT_APPOINTMENT_MESSAGES.SORT_CREATED_DESC },
  { value: 'CREATED_ASC', label: STUDENT_APPOINTMENT_MESSAGES.SORT_CREATED_ASC },
];

const EMPTY_APPOINTMENTS: StudentAppointmentListItem[] = [];

function defaultFiltersForTab(tab: AppointmentTab): StudentAppointmentListFilters {
  return {
    ...DEFAULT_STUDENT_APPOINTMENT_FILTERS,
    sort: tab === 'past' ? 'DATE_DESC' : 'DATE_ASC',
  };
}

export default function StudentAppointmentsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AppointmentTab>('active');
  const [viewMode, setViewMode] = useState<AppointmentViewMode>('list');
  const [appointmentsByTab, setAppointmentsByTab] = useState<
    Partial<Record<AppointmentTab, StudentAppointmentListItem[]>>
  >({});
  const [loadingByTab, setLoadingByTab] = useState<Partial<Record<AppointmentTab, boolean>>>({
    active: true,
  });
  const [errorByTab, setErrorByTab] = useState<Partial<Record<AppointmentTab, string | null>>>(
    {},
  );
  const [filters, setFilters] = useState<StudentAppointmentListFilters>(
    defaultFiltersForTab('active'),
  );
  const [cancelTarget, setCancelTarget] = useState<StudentAppointmentListItem | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const requestIdByTab = useRef<Record<AppointmentTab, number>>({ active: 0, past: 0 });

  const loadTab = useCallback(async (tab: AppointmentTab) => {
    const requestId = requestIdByTab.current[tab] + 1;
    requestIdByTab.current[tab] = requestId;
    setLoadingByTab((current) => ({ ...current, [tab]: true }));
    setErrorByTab((current) => ({ ...current, [tab]: null }));

    try {
      const data =
        tab === 'active'
          ? await getStudentActiveAppointments()
          : await getStudentPastAppointments();
      if (requestIdByTab.current[tab] !== requestId) {
        return;
      }
      setAppointmentsByTab((current) => ({ ...current, [tab]: data }));
    } catch (err) {
      if (requestIdByTab.current[tab] !== requestId) {
        return;
      }
      const fallback =
        tab === 'active'
          ? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_LOAD_ERROR
          : STUDENT_APPOINTMENT_MESSAGES.PAST_LOAD_ERROR;
      const message = resolveStudentApiError(err, fallback);
      setErrorByTab((current) => ({ ...current, [tab]: message }));
    } finally {
      if (requestIdByTab.current[tab] === requestId) {
        setLoadingByTab((current) => ({ ...current, [tab]: false }));
      }
    }
  }, []);

  useEffect(() => {
    void loadTab('active');
  }, [loadTab]);

  const handleTabChange = (tab: AppointmentTab) => {
    if (tab === activeTab) {
      return;
    }
    setActiveTab(tab);
    setFilters(defaultFiltersForTab(tab));
    // Load once per tab; keep error state until user retries.
    if (
      appointmentsByTab[tab] === undefined
      && !loadingByTab[tab]
      && !errorByTab[tab]
    ) {
      void loadTab(tab);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget || cancelLoading) {
      return;
    }
    setCancelLoading(true);
    setCancelError(null);
    try {
      await cancelStudentAppointment(cancelTarget.appointmentId);
      setAppointmentsByTab((current) => ({
        ...current,
        active: (current.active ?? []).filter(
          (item) => item.appointmentId !== cancelTarget.appointmentId,
        ),
        // Invalidate past cache so cancelled items appear after refetch.
        past: undefined,
      }));
      setErrorByTab((current) => ({ ...current, past: null }));
      setCancelTarget(null);
      toast.success(STUDENT_APPOINTMENT_MESSAGES.CANCEL_SUCCESS);
    } catch (err) {
      const message = resolveStudentApiError(err, STUDENT_APPOINTMENT_MESSAGES.CANCEL_ERROR);
      setCancelError(message);
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  const appointments = appointmentsByTab[activeTab] ?? EMPTY_APPOINTMENTS;
  const filteredAppointments = useMemo(
    () => filterAndSortStudentAppointments(appointments, filters),
    [appointments, filters],
  );
  const filtersActive = hasActiveStudentAppointmentFilters(filters);
  const statusOptions = activeTab === 'active' ? ACTIVE_STATUS_OPTIONS : PAST_STATUS_OPTIONS;
  const loading = Boolean(loadingByTab[activeTab]);
  const error = errorByTab[activeTab] ?? null;
  const tabLoaded = appointmentsByTab[activeTab] !== undefined;

  const emptyTitle =
    activeTab === 'active'
      ? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_EMPTY_TITLE
      : STUDENT_APPOINTMENT_MESSAGES.PAST_EMPTY_TITLE;
  const emptyDescription =
    activeTab === 'active'
      ? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_EMPTY_DESCRIPTION
      : STUDENT_APPOINTMENT_MESSAGES.PAST_EMPTY_DESCRIPTION;
  const loadingLabel =
    activeTab === 'active'
      ? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_LOADING
      : STUDENT_APPOINTMENT_MESSAGES.PAST_LOADING;

  const updateFilter = <K extends keyof StudentAppointmentListFilters>(
    key: K,
    value: StudentAppointmentListFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  let content;
  if (loading) {
    content = <StudentLoadingState label={loadingLabel} />;
  } else if (error) {
    content = <StudentErrorState message={error} onRetry={() => void loadTab(activeTab)} />;
  } else if (!tabLoaded) {
    content = <StudentLoadingState label={loadingLabel} />;
  } else if (appointments.length === 0) {
    content = (
      <StudentEmptyState
        icon={activeTab === 'active' ? 'event_note' : 'history'}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  } else {
    content = (
      <>
        <section className="mb-3 rounded-lg border border-outline-variant/80 bg-surface-container-lowest p-2.5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className={`${STUDENT_UI.SEARCH_FIELD_WRAP_CLASS} h-10 lg:min-w-[14rem] lg:flex-[1.35]`}>
              <span
                className={STUDENT_UI.SEARCH_ICON_CLASS}
                aria-hidden
              >
                search
              </span>
              <input
                type="search"
                className={STUDENT_UI.SEARCH_INPUT_CLASS}
                placeholder={STUDENT_APPOINTMENT_MESSAGES.SEARCH_PLACEHOLDER}
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                aria-label={STUDENT_APPOINTMENT_MESSAGES.SEARCH_LABEL}
              />
            </div>

            <select
              className={`${STUDENT_UI.FILTER_CONTROL_CLASS} h-10 lg:flex-1`}
              aria-label={STUDENT_APPOINTMENT_MESSAGES.FILTER_STATUS}
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
            >
              <option value="">{STUDENT_APPOINTMENT_MESSAGES.FILTER_STATUS_ALL}</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {APPOINTMENT_STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>

            <select
              className={`${STUDENT_UI.FILTER_CONTROL_CLASS} h-10 lg:flex-1`}
              aria-label={STUDENT_APPOINTMENT_MESSAGES.FILTER_MEETING_TYPE}
              value={filters.meetingType}
              onChange={(event) => updateFilter('meetingType', event.target.value)}
            >
              <option value="">
                {STUDENT_APPOINTMENT_MESSAGES.FILTER_MEETING_TYPE_ALL}
              </option>
              <option value={MEETING_TYPE.FACE_TO_FACE}>
                {getMeetingTypeLabel(MEETING_TYPE.FACE_TO_FACE)}
              </option>
              <option value={MEETING_TYPE.ONLINE}>
                {getMeetingTypeLabel(MEETING_TYPE.ONLINE)}
              </option>
            </select>

            <input
              type="date"
              className={`${STUDENT_UI.FILTER_CONTROL_CLASS} h-10 lg:w-[9.75rem] lg:flex-none`}
              aria-label={STUDENT_APPOINTMENT_MESSAGES.FILTER_DATE_FROM}
              value={filters.dateFrom}
              onChange={(event) => updateFilter('dateFrom', event.target.value)}
            />

            <input
              type="date"
              className={`${STUDENT_UI.FILTER_CONTROL_CLASS} h-10 lg:w-[9.75rem] lg:flex-none`}
              aria-label={STUDENT_APPOINTMENT_MESSAGES.FILTER_DATE_TO}
              value={filters.dateTo}
              onChange={(event) => updateFilter('dateTo', event.target.value)}
            />

            <select
              className={`${STUDENT_UI.FILTER_CONTROL_CLASS} h-10 lg:flex-1`}
              aria-label={STUDENT_APPOINTMENT_MESSAGES.FILTER_SORT}
              value={filters.sort}
              onChange={(event) =>
                updateFilter('sort', event.target.value as StudentAppointmentSort)
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {filtersActive ? (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                className={STUDENT_UI.SECONDARY_BUTTON_CLASS}
                onClick={() => setFilters(defaultFiltersForTab(activeTab))}
              >
                {STUDENT_APPOINTMENT_MESSAGES.FILTER_CLEAR}
              </button>
            </div>
          ) : null}
        </section>

        {filteredAppointments.length === 0 ? (
          <StudentEmptyState
            icon={viewMode === 'calendar' ? 'event_busy' : 'filter_alt_off'}
            title={
              viewMode === 'calendar'
                ? STUDENT_APPOINTMENT_MESSAGES.CALENDAR_EMPTY_TITLE
                : STUDENT_APPOINTMENT_MESSAGES.FILTER_EMPTY_TITLE
            }
            description={
              viewMode === 'calendar'
                ? STUDENT_APPOINTMENT_MESSAGES.CALENDAR_EMPTY_DESCRIPTION
                : STUDENT_APPOINTMENT_MESSAGES.FILTER_EMPTY
            }
          />
        ) : viewMode === 'calendar' ? (
          <div className="h-[calc(100vh-16rem)] min-h-[430px]">
            <StudentAppointmentsCalendar
              appointments={filteredAppointments}
              onAppointmentClick={(appointment) => {
                navigate(studentAppointmentDetailPath(appointment.appointmentId));
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAppointments.map((appointment) => (
              <StudentAppointmentCard
                key={appointment.appointmentId}
                appointment={appointment}
                showCancel={activeTab === 'active'}
                cancelLoading={cancelLoading}
                onCancelRequest={(item) => {
                  setCancelError(null);
                  setCancelTarget(item);
                }}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <StudentPageHeader
        title={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_SUBTITLE}
      />

      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <StudentSegmentedTabs
          value={activeTab}
          options={TAB_OPTIONS}
          ariaLabel={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_TITLE}
          onChange={handleTabChange}
          className="pb-0 sm:!w-auto"
        />
        <StudentSegmentedTabs
          value={viewMode}
          options={VIEW_OPTIONS}
          ariaLabel={STUDENT_APPOINTMENT_MESSAGES.VIEW_MODE_LABEL}
          onChange={setViewMode}
          className="pb-0 sm:ml-auto sm:!w-auto"
        />
      </div>

      {content}

      <ConfirmModal
        open={cancelTarget !== null}
        title={STUDENT_APPOINTMENT_MESSAGES.CANCEL_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.CANCEL_DESCRIPTION}
        confirmLabel={STUDENT_APPOINTMENT_MESSAGES.CANCEL_CONFIRM}
        cancelLabel={STUDENT_APPOINTMENT_MESSAGES.CANCEL_DISMISS}
        variant="danger"
        loading={cancelLoading}
        error={cancelError}
        onConfirm={() => void handleConfirmCancel()}
        onClose={() => {
          if (!cancelLoading) {
            setCancelTarget(null);
            setCancelError(null);
          }
        }}
      />
    </div>
  );
}
