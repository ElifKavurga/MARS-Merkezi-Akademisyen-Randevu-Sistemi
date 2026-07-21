import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import AcademicianAppointmentCard from '../components/AcademicianAppointmentCard';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import {
  STAFF_APPOINTMENT_MESSAGES,
} from '../constants/appointment';
import { academicianAppointmentDetailPath } from '../constants/routes';
import { STUDENT_UI } from '../constants/studentUi';
import { getStaffAppointments } from '../services/appointmentService';
import type { AppointmentStatus, StaffAppointment } from '../types/appointment';

// ─── Tab tanımları ────────────────────────────────────────────────────────────
type AcademicianTab = AppointmentStatus;

const TABS: { value: AcademicianTab; label: string; icon: string }[] = [
  { value: 'PENDING',   label: STAFF_APPOINTMENT_MESSAGES.TAB_PENDING,   icon: 'pending' },
  { value: 'APPROVED',  label: STAFF_APPOINTMENT_MESSAGES.TAB_APPROVED,  icon: 'check_circle' },
  { value: 'REJECTED',  label: STAFF_APPOINTMENT_MESSAGES.TAB_REJECTED,  icon: 'cancel' },
  { value: 'COMPLETED', label: STAFF_APPOINTMENT_MESSAGES.TAB_COMPLETED, icon: 'task_alt' },
  { value: 'NO_SHOW',   label: STAFF_APPOINTMENT_MESSAGES.TAB_NO_SHOW,   icon: 'person_off' },
  { value: 'CANCELLED', label: STAFF_APPOINTMENT_MESSAGES.TAB_CANCELLED, icon: 'event_busy' },
];

const EMPTY_MAP: Record<AcademicianTab, string> = {
  PENDING:   STAFF_APPOINTMENT_MESSAGES.EMPTY_PENDING,
  APPROVED:  STAFF_APPOINTMENT_MESSAGES.EMPTY_APPROVED,
  REJECTED:  STAFF_APPOINTMENT_MESSAGES.EMPTY_REJECTED,
  COMPLETED: STAFF_APPOINTMENT_MESSAGES.EMPTY_COMPLETED,
  NO_SHOW:   STAFF_APPOINTMENT_MESSAGES.EMPTY_NO_SHOW,
  CANCELLED: STAFF_APPOINTMENT_MESSAGES.EMPTY_CANCELLED,
};

// ─── Sıralama ─────────────────────────────────────────────────────────────────
type SortKey = 'DATE_ASC' | 'DATE_DESC' | 'CREATED_DESC' | 'CREATED_ASC';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'DATE_ASC',     label: STAFF_APPOINTMENT_MESSAGES.SORT_DATE_ASC },
  { value: 'DATE_DESC',    label: STAFF_APPOINTMENT_MESSAGES.SORT_DATE_DESC },
  { value: 'CREATED_DESC', label: STAFF_APPOINTMENT_MESSAGES.SORT_CREATED_DESC },
  { value: 'CREATED_ASC',  label: STAFF_APPOINTMENT_MESSAGES.SORT_CREATED_ASC },
];

function compareDateTime(a: StaffAppointment, b: StaffAppointment): number {
  const byDate = a.appointmentDate.localeCompare(b.appointmentDate);
  return byDate !== 0 ? byDate : a.startTime.localeCompare(b.startTime);
}

function sortAppointments(list: StaffAppointment[], key: SortKey): StaffAppointment[] {
  const copy = [...list];
  copy.sort((a, b) => {
    switch (key) {
      case 'DATE_DESC':    return compareDateTime(b, a);
      case 'CREATED_DESC': return (b.appointmentId - a.appointmentId);
      case 'CREATED_ASC':  return (a.appointmentId - b.appointmentId);
      default:             return compareDateTime(a, b);
    }
  });
  return copy;
}

// ─── Bileşen ──────────────────────────────────────────────────────────────────
const SCOPE = 'academician' as const;
const EMPTY_LIST: StaffAppointment[] = [];

export default function AcademicianAppointmentsPage() {
  const [activeTab, setActiveTab] = useState<AcademicianTab>('PENDING');
  const [byTab, setByTab] = useState<Partial<Record<AcademicianTab, StaffAppointment[]>>>({});
  const [loadingByTab, setLoadingByTab] = useState<Partial<Record<AcademicianTab, boolean>>>({ PENDING: true });
  const [errorByTab, setErrorByTab] = useState<Partial<Record<AcademicianTab, string | null>>>({});
  const reqIdRef = useRef<Partial<Record<AcademicianTab, number>>>({});

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('DATE_ASC');

  const navigate = useNavigate();

  // ── Veri yükleme ────────────────────────────────────────────────────────────
  const loadTab = useCallback(async (tab: AcademicianTab) => {
    const reqId = (reqIdRef.current[tab] ?? 0) + 1;
    reqIdRef.current[tab] = reqId;
    setLoadingByTab((p) => ({ ...p, [tab]: true }));
    setErrorByTab((p) => ({ ...p, [tab]: null }));
    try {
      const data = await getStaffAppointments(SCOPE, tab);
      if (reqIdRef.current[tab] !== reqId) return;
      setByTab((p) => ({ ...p, [tab]: data }));
    } catch (err) {
      if (reqIdRef.current[tab] !== reqId) return;
      const message =
        isAxiosError(err) && err.response?.status === 403
          ? STAFF_APPOINTMENT_MESSAGES.ACCESS_DENIED
          : STAFF_APPOINTMENT_MESSAGES.LOAD_ERROR;
      setErrorByTab((p) => ({ ...p, [tab]: message }));
    } finally {
      if (reqIdRef.current[tab] === reqId) {
        setLoadingByTab((p) => ({ ...p, [tab]: false }));
      }
    }
  }, []);

  useEffect(() => {
    void loadTab('PENDING');
  }, [loadTab]);

  const handleTabChange = (tab: AcademicianTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSearch('');
    setSort('DATE_ASC');
    if (byTab[tab] === undefined && !loadingByTab[tab] && !errorByTab[tab]) {
      void loadTab(tab);
    }
  };

  // ── Detay ───────────────────────────────────────────────────────────────────
  const handleDetailClick = (appointmentId: number) => {
    navigate(academicianAppointmentDetailPath(appointmentId));
  };

  // ── Filtreleme & sıralama ────────────────────────────────────────────────────
  const rawList = byTab[activeTab] ?? EMPTY_LIST;
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    const result = q
      ? rawList.filter((a) => a.studentName.toLocaleLowerCase('tr-TR').includes(q))
      : rawList;
    return sortAppointments(result, sort);
  }, [rawList, search, sort]);

  const isLoading = Boolean(loadingByTab[activeTab]);
  const error = errorByTab[activeTab] ?? null;
  const tabLoaded = byTab[activeTab] !== undefined;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-w-0 animate-fade-in">
      <StudentPageHeader
        title={STAFF_APPOINTMENT_MESSAGES.TITLE}
        description={STAFF_APPOINTMENT_MESSAGES.SUBTITLE}
      />

      {/* ── Sekme çubuğu ── */}
      <div className="mb-6 overflow-x-auto">
        <nav
          className="flex min-w-max gap-1 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-1"
          role="tablist"
          aria-label="Randevu durumu sekmeleri"
        >
          {TABS.map((tab) => {
            const isActive = tab.value === activeTab;
            const count = byTab[tab.value]?.length;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                id={`tab-${tab.value}`}
                aria-controls={`tabpanel-${tab.value}`}
                className={[
                  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 font-label-md text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                ].join(' ')}
                onClick={() => handleTabChange(tab.value)}
              >
                <span
                  className={`material-symbols-outlined text-[15px] ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}
                  aria-hidden
                >
                  {tab.icon}
                </span>
                {tab.label}
                {count !== undefined && count > 0 ? (
                  <span
                    className={`ml-0.5 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none ${
                      isActive
                        ? 'bg-on-primary/15 text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Arama & Sıralama ── */}
      <section className="mb-5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Arama */}
          <div className={`${STUDENT_UI.SEARCH_FIELD_WRAP_CLASS} sm:flex-1`}>
            <span
              className="material-symbols-outlined shrink-0 text-[20px] leading-none text-on-surface-variant"
              aria-hidden
            >
              search
            </span>
            <input
              type="search"
              id="acad-appt-search"
              className={STUDENT_UI.SEARCH_INPUT_CLASS}
              placeholder={STAFF_APPOINTMENT_MESSAGES.SEARCH_PLACEHOLDER}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={STAFF_APPOINTMENT_MESSAGES.SEARCH_LABEL}
            />
          </div>

          {/* Sıralama */}
          <select
            id="acad-appt-sort"
            className={`${STUDENT_UI.FILTER_CONTROL_CLASS} sm:w-56 sm:flex-none`}
            aria-label={STAFF_APPOINTMENT_MESSAGES.SORT_LABEL}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ── İçerik ── */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {isLoading ? (
          <StudentLoadingState label={STAFF_APPOINTMENT_MESSAGES.LOADING} />
        ) : error ? (
          <StudentErrorState
            message={error}
            onRetry={() => void loadTab(activeTab)}
          />
        ) : !tabLoaded ? (
          <StudentLoadingState label={STAFF_APPOINTMENT_MESSAGES.LOADING} />
        ) : filtered.length === 0 ? (
          <StudentEmptyState
            icon={rawList.length === 0 ? 'event_note' : 'filter_alt_off'}
            title={
              rawList.length === 0
                ? EMPTY_MAP[activeTab]
                : 'Sonuç bulunamadı'
            }
            description={
              rawList.length === 0
                ? ''
                : `"${search}" için eşleşen öğrenci bulunamadı.`
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((appointment) => (
              <AcademicianAppointmentCard
                key={appointment.appointmentId}
                appointment={appointment}
                onDetailClick={handleDetailClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
