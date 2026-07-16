import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import AvailabilityCreateModal from '../components/AvailabilityCreateModal';
import AvailabilityEditModal from '../components/AvailabilityEditModal';
import AvailabilityStatusBadge from '../components/AvailabilityStatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import CourseStatCard from '../components/CourseStatCard';
import Loading from '../components/Loading';
import RecurrenceRuleEditModal from '../components/RecurrenceRuleEditModal';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants';
import {
  AVAILABILITY_MESSAGES,
  AVAILABILITY_SORT_FIELD,
  AVAILABILITY_STATUS_FILTER,
  DAY_OF_WEEK_LABELS,
  formatTimeLabel,
  getDayOfWeekLabel,
  getDayOfWeekValue,
  getDurationMinutes,
  type AvailabilitySortField,
} from '../constants/availability';
import { RECURRENCE_MESSAGES } from '../constants/recurrence';
import { useToast } from '../hooks/useToast';
import {
  getMyAvailabilitySlots,
  getMyAvailabilityStats,
  updateAvailabilitySlotBlocked,
} from '../services/availabilityService';
import { endRecurrenceRule } from '../services/recurrenceService';
import type {
  AvailabilitySlot,
  AvailabilitySlotStats,
  AvailabilityStatusFilter,
} from '../types/availability';

type SortDirection = 'asc' | 'desc';

const DAY_FILTER_OPTIONS = [
  { value: '', label: 'Gün: Tümü' },
  { value: '1', label: DAY_OF_WEEK_LABELS[1] },
  { value: '2', label: DAY_OF_WEEK_LABELS[2] },
  { value: '3', label: DAY_OF_WEEK_LABELS[3] },
  { value: '4', label: DAY_OF_WEEK_LABELS[4] },
  { value: '5', label: DAY_OF_WEEK_LABELS[5] },
  { value: '6', label: DAY_OF_WEEK_LABELS[6] },
  { value: '0', label: DAY_OF_WEEK_LABELS[0] },
] as const;

const EMPTY_STATS: AvailabilitySlotStats = {
  totalSlotCount: 0,
  availableSlotCount: 0,
  blockedSlotCount: 0,
  thisWeekSlotCount: 0,
};

function compareSlots(
  a: AvailabilitySlot,
  b: AvailabilitySlot,
  field: AvailabilitySortField,
  direction: SortDirection,
): number {
  const factor = direction === 'asc' ? 1 : -1;
  const left = String(a[field] ?? '');
  const right = String(b[field] ?? '');
  return left.localeCompare(right, 'tr-TR') * factor;
}

function SortableHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: AvailabilitySortField;
  activeField: AvailabilitySortField;
  direction: SortDirection;
  onSort: (field: AvailabilitySortField) => void;
}) {
  const isActive = activeField === field;

  return (
    <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
      <button
        type="button"
        className="inline-flex w-full items-center gap-1 justify-start border-0 bg-transparent p-0 m-0 shadow-none appearance-none cursor-pointer font-inherit text-inherit hover:text-on-background transition-colors focus:outline-none focus-visible:text-on-background"
        onClick={() => onSort(field)}
        aria-label={`${label} sütununa göre sırala`}
      >
        <span className={isActive ? 'text-on-background' : undefined}>{label}</span>
        <span
          className={`material-symbols-outlined text-[16px] leading-none ${
            isActive ? 'text-on-background' : 'text-on-surface-variant/50'
          }`}
          aria-hidden="true"
        >
          {isActive ? (direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
        </span>
      </button>
    </th>
  );
}

export default function AcademicianAvailabilityPage() {
  const toast = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [stats, setStats] = useState<AvailabilitySlotStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatusFilter>(
    AVAILABILITY_STATUS_FILTER.ALL,
  );
  const [sortField, setSortField] = useState<AvailabilitySortField>(
    AVAILABILITY_SORT_FIELD.SLOT_DATE,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [editingRecurrenceSlot, setEditingRecurrenceSlot] = useState<AvailabilitySlot | null>(null);
  const [endingRecurrenceSlot, setEndingRecurrenceSlot] = useState<AvailabilitySlot | null>(null);
  const [endLoading, setEndLoading] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<AvailabilitySlot | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slotData, statsData] = await Promise.all([
        getMyAvailabilitySlots(),
        getMyAvailabilityStats(),
      ]);
      setSlots(slotData);
      setStats(statsData);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setError(AVAILABILITY_MESSAGES.ACCESS_DENIED);
        toast.error(AVAILABILITY_MESSAGES.ACCESS_DENIED);
      } else {
        setError(AVAILABILITY_MESSAGES.LOAD_ERROR);
        toast.error(AVAILABILITY_MESSAGES.LOAD_ERROR);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const filteredSlots = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR');

    const filtered = slots.filter((slot) => {
      if (statusFilter === AVAILABILITY_STATUS_FILTER.AVAILABLE && slot.isBlocked) {
        return false;
      }
      if (statusFilter === AVAILABILITY_STATUS_FILTER.BLOCKED && !slot.isBlocked) {
        return false;
      }

      if (dayFilter !== '') {
        const dayValue = getDayOfWeekValue(slot.slotDate);
        if (String(dayValue) !== dayFilter) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      const dayLabel = getDayOfWeekLabel(slot.slotDate).toLocaleLowerCase('tr-TR');
      const start = formatTimeLabel(slot.startTime).toLocaleLowerCase('tr-TR');
      const end = formatTimeLabel(slot.endTime).toLocaleLowerCase('tr-TR');
      const date = slot.slotDate.toLocaleLowerCase('tr-TR');
      const duration = String(getDurationMinutes(slot.startTime, slot.endTime));
      const statusLabel = slot.isBlocked ? 'engelli' : 'uygun';

      return (
        dayLabel.includes(query) ||
        start.includes(query) ||
        end.includes(query) ||
        date.includes(query) ||
        duration.includes(query) ||
        statusLabel.includes(query)
      );
    });

    return [...filtered].sort((a, b) => compareSlots(a, b, sortField, sortDirection));
  }, [slots, searchQuery, dayFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: AvailabilitySortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const handleConfirmEndRecurrence = async () => {
    if (!endingRecurrenceSlot?.recurrenceRuleId || endLoading) {
      return;
    }

    setEndLoading(true);
    setEndError(null);
    try {
      await endRecurrenceRule(endingRecurrenceSlot.recurrenceRuleId);
      toast.success(RECURRENCE_MESSAGES.END_SUCCESS);
      setEndingRecurrenceSlot(null);
      await loadPageData();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setEndError(backendMessage);
        } else if (err.response?.status === 403) {
          setEndError(RECURRENCE_MESSAGES.ACCESS_DENIED);
        } else if (err.response?.status === 404) {
          setEndError(RECURRENCE_MESSAGES.NOT_FOUND);
        } else {
          setEndError(RECURRENCE_MESSAGES.END_ERROR);
        }
      } else {
        setEndError(RECURRENCE_MESSAGES.END_ERROR);
      }
    } finally {
      setEndLoading(false);
    }
  };

  const handleConfirmBlockChange = async () => {
    if (!blockTarget || blockLoading) {
      return;
    }

    const nextBlocked = !blockTarget.isBlocked;
    setBlockLoading(true);
    setBlockError(null);
    try {
      await updateAvailabilitySlotBlocked(blockTarget.slotId, { isBlocked: nextBlocked });
      toast.success(
        nextBlocked ? AVAILABILITY_MESSAGES.BLOCK_SUCCESS : AVAILABILITY_MESSAGES.UNBLOCK_SUCCESS,
      );
      setBlockTarget(null);
      await loadPageData();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setBlockError(backendMessage);
        } else if (err.response?.status === 403) {
          setBlockError(AVAILABILITY_MESSAGES.ACCESS_DENIED);
        } else if (err.response?.status === 404) {
          setBlockError(AVAILABILITY_MESSAGES.NOT_FOUND);
        } else {
          setBlockError(AVAILABILITY_MESSAGES.BLOCK_ERROR);
        }
      } else {
        setBlockError(AVAILABILITY_MESSAGES.BLOCK_ERROR);
      }
    } finally {
      setBlockLoading(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Ofis Saatleri</h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Tanımlı ofis saatlerinizi görüntüleyin, filtreleyin ve yönetin.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <CourseStatCard label="Toplam Slot" value={stats.totalSlotCount} icon="calendar_month" />
        <CourseStatCard
          label="Kullanılabilir Slot"
          value={stats.availableSlotCount}
          icon="event_available"
        />
        <CourseStatCard label="Engellenen Slot" value={stats.blockedSlotCount} icon="event_busy" />
        <CourseStatCard
          label="Bu Haftaki Slot Sayısı"
          value={stats.thisWeekSlotCount}
          icon="date_range"
        />
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shrink-0">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  schedule
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                Size ait müsaitlik slotları
              </p>
            </div>
            <button
              type="button"
              className="bg-[#0b1641] text-white px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-[#152a5c] transition-colors flex items-center gap-2 shrink-0"
              onClick={() => setCreateOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px] leading-none">add</span>
              Yeni Ofis Saati
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            <select
              id="availability-day-filter"
              aria-label="Gün filtresi"
              className={FORM_SELECT_CLASS}
              value={dayFilter}
              onChange={(event) => setDayFilter(event.target.value)}
            >
              {DAY_FILTER_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              id="availability-status-filter"
              aria-label="Durum filtresi"
              className={FORM_SELECT_CLASS}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as AvailabilityStatusFilter)
              }
            >
              <option value={AVAILABILITY_STATUS_FILTER.ALL}>Durum: Tümü</option>
              <option value={AVAILABILITY_STATUS_FILTER.AVAILABLE}>Durum: Uygun</option>
              <option value={AVAILABILITY_STATUS_FILTER.BLOCKED}>Durum: Engelli</option>
            </select>

            <div className="relative sm:col-span-2 xl:col-span-2">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center material-symbols-outlined text-on-surface-variant text-[20px] leading-none"
                aria-hidden="true"
              >
                search
              </span>
              <input
                id="availability-search"
                type="search"
                aria-label="Ofis saati ara"
                className={`${FORM_FIELD_CLASS} pl-10`}
                placeholder="Gün, saat veya tarih ara..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-w-full">
          {loading ? (
            <div className="p-8">
              <Loading label="Ofis saatleri yükleniyor..." />
            </div>
          ) : error ? (
            <div className="p-8">
              <p className="font-label-sm text-label-sm text-error" role="alert">
                {error}
              </p>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                  schedule
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                {AVAILABILITY_MESSAGES.EMPTY_TITLE}
              </p>
              <button
                type="button"
                className="bg-[#0b1641] text-white px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-[#152a5c] transition-colors flex items-center gap-2"
                onClick={() => setCreateOpen(true)}
              >
                <span className="material-symbols-outlined text-[18px] leading-none">add</span>
                {AVAILABILITY_MESSAGES.EMPTY_CTA}
              </button>
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {AVAILABILITY_MESSAGES.EMPTY_FILTER}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[780px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-tint/5 border-b border-outline-variant">
                  <SortableHeader
                    label="Tarih"
                    field={AVAILABILITY_SORT_FIELD.SLOT_DATE}
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Başlangıç Saati"
                    field={AVAILABILITY_SORT_FIELD.START_TIME}
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Bitiş Saati"
                    field={AVAILABILITY_SORT_FIELD.END_TIME}
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Slot Süresi
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-center">
                    Durum
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-right">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.map((slot) => {
                  const duration = getDurationMinutes(slot.startTime, slot.endTime);
                  return (
                    <tr
                      key={slot.slotId}
                      className="border-b border-outline-variant/40 hover:bg-surface-container/30 transition-colors"
                    >
                      <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{getDayOfWeekLabel(slot.slotDate)}</span>
                          {slot.recurrenceRuleId != null ? (
                            <span className="inline-flex items-center rounded-md bg-[#0b1641]/10 px-2 py-0.5 font-label-sm text-label-sm text-[#0b1641]">
                              {AVAILABILITY_MESSAGES.RECURRING_BADGE}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                          {slot.slotDate}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                        {formatTimeLabel(slot.startTime)}
                      </td>
                      <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                        {formatTimeLabel(slot.endTime)}
                      </td>
                      <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                        {duration} dk
                      </td>
                      <td className="py-4 px-6 text-center">
                        <AvailabilityStatusBadge isBlocked={slot.isBlocked} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap justify-end gap-2">
                          {!slot.isBlocked ? (
                            <>
                              <AdminActionButton
                                variant="primary"
                                icon="edit"
                                onClick={() => setEditingSlot(slot)}
                              >
                                Düzenle
                              </AdminActionButton>
                              {slot.recurrenceRuleId != null ? (
                                <>
                                  <AdminActionButton
                                    variant="neutral"
                                    icon="edit_calendar"
                                    onClick={() => setEditingRecurrenceSlot(slot)}
                                  >
                                    Tekrarı Düzenle
                                  </AdminActionButton>
                                  <AdminActionButton
                                    variant="danger"
                                    icon="event_busy"
                                    onClick={() => {
                                      setEndError(null);
                                      setEndingRecurrenceSlot(slot);
                                    }}
                                  >
                                    Tekrarı Sonlandır
                                  </AdminActionButton>
                                </>
                              ) : null}
                              <AdminActionButton
                                variant="danger"
                                icon="block"
                                onClick={() => {
                                  setBlockError(null);
                                  setBlockTarget(slot);
                                }}
                              >
                                Engelle
                              </AdminActionButton>
                            </>
                          ) : (
                            <AdminActionButton
                              variant="primary"
                              icon="check_circle"
                              onClick={() => {
                                setBlockError(null);
                                setBlockTarget(slot);
                              }}
                            >
                              Engeli Kaldır
                            </AdminActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AvailabilityCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(message) => {
          toast.success(message);
          void loadPageData();
        }}
      />

      <AvailabilityEditModal
        open={editingSlot !== null}
        slot={editingSlot}
        onClose={() => setEditingSlot(null)}
        onUpdated={(message) => {
          toast.success(message);
          void loadPageData();
        }}
      />

      <RecurrenceRuleEditModal
        open={editingRecurrenceSlot !== null}
        recurrenceRuleId={editingRecurrenceSlot?.recurrenceRuleId ?? null}
        slot={editingRecurrenceSlot}
        onClose={() => setEditingRecurrenceSlot(null)}
        onUpdated={(message) => {
          toast.success(message);
          void loadPageData();
        }}
      />

      <ConfirmModal
        open={endingRecurrenceSlot !== null}
        title={RECURRENCE_MESSAGES.END_CONFIRM_TITLE}
        description={RECURRENCE_MESSAGES.END_CONFIRM_DESCRIPTION}
        confirmLabel="Sonlandır"
        cancelLabel="İptal"
        loading={endLoading}
        error={endError}
        variant="danger"
        onConfirm={() => void handleConfirmEndRecurrence()}
        onClose={() => {
          if (endLoading) {
            return;
          }
          setEndError(null);
          setEndingRecurrenceSlot(null);
        }}
      />

      <ConfirmModal
        open={blockTarget !== null}
        title={
          blockTarget?.isBlocked
            ? AVAILABILITY_MESSAGES.UNBLOCK_CONFIRM_TITLE
            : AVAILABILITY_MESSAGES.BLOCK_CONFIRM_TITLE
        }
        description={
          blockTarget?.isBlocked
            ? AVAILABILITY_MESSAGES.UNBLOCK_CONFIRM_DESCRIPTION
            : AVAILABILITY_MESSAGES.BLOCK_CONFIRM_DESCRIPTION
        }
        confirmLabel={blockTarget?.isBlocked ? 'Engeli Kaldır' : 'Engelle'}
        cancelLabel="İptal"
        loading={blockLoading}
        error={blockError}
        variant={blockTarget?.isBlocked ? 'primary' : 'danger'}
        onConfirm={() => void handleConfirmBlockChange()}
        onClose={() => {
          if (blockLoading) {
            return;
          }
          setBlockError(null);
          setBlockTarget(null);
        }}
      />
    </div>
  );
}
