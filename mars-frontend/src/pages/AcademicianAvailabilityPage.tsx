import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import AvailabilityCreateModal from '../components/AvailabilityCreateModal';
import AvailabilityEditModal from '../components/AvailabilityEditModal';
import AvailabilityStatusBadge from '../components/AvailabilityStatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import Loading from '../components/Loading';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants';
import {
  AVAILABILITY_MESSAGES,
  AVAILABILITY_STATUS_FILTER,
  DAY_OF_WEEK_LABELS,
  formatTimeLabel,
  getDayOfWeekLabel,
  getDayOfWeekValue,
  getDurationMinutes,
} from '../constants/availability';
import { useToast } from '../hooks/useToast';
import {
  getMyAvailabilitySlots,
  updateAvailabilitySlotBlocked,
} from '../services/availabilityService';
import type { AvailabilitySlot, AvailabilityStatusFilter } from '../types/availability';

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

export default function AcademicianAvailabilityPage() {
  const toast = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatusFilter>(
    AVAILABILITY_STATUS_FILTER.ALL,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [blockTarget, setBlockTarget] = useState<AvailabilitySlot | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyAvailabilitySlots();
      setSlots(data);
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
    void loadSlots();
  }, [loadSlots]);

  const filteredSlots = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR');

    return slots.filter((slot) => {
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
  }, [slots, searchQuery, dayFilter, statusFilter]);

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
      await loadSlots();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setBlockError(backendMessage);
        } else if (err.response?.status === 403) {
          setBlockError(AVAILABILITY_MESSAGES.ACCESS_DENIED);
        } else if (err.response?.status === 404) {
          setBlockError('Ofis saati bulunamadı.');
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
          Tanımlı ofis saatlerinizi görüntüleyin ve filtreleyin.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                schedule
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Size ait müsaitlik slotları
            </p>
            <button
              type="button"
              className="bg-[#0b1641] text-white px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-[#152a5c] transition-colors flex items-center gap-2"
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

            <input
              id="availability-search"
              type="search"
              aria-label="Ofis saati ara"
              className={`${FORM_FIELD_CLASS} sm:col-span-2 xl:col-span-2`}
              placeholder="Gün, saat veya tarih ara..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
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
            <div className="p-8 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {AVAILABILITY_MESSAGES.EMPTY_TITLE}
              </p>
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {AVAILABILITY_MESSAGES.EMPTY_FILTER}
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-surface-container/50 border-b border-outline-variant">
                <tr>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Gün
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Başlangıç
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Bitiş
                  </th>
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
                        <div>{getDayOfWeekLabel(slot.slotDate)}</div>
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
          void loadSlots();
        }}
      />

      <AvailabilityEditModal
        open={editingSlot !== null}
        slot={editingSlot}
        onClose={() => setEditingSlot(null)}
        onUpdated={(message) => {
          toast.success(message);
          void loadSlots();
        }}
      />

      <ConfirmModal
        open={blockTarget !== null}
        title={
          blockTarget?.isBlocked ? 'Ofis Saatini Yeniden Aktif Et' : 'Ofis Saatini Engelle'
        }
        description={
          blockTarget?.isBlocked
            ? 'Bu ofis saatini tekrar kullanılabilir hale getirmek istediğinize emin misiniz?'
            : 'Bu ofis saatini geçici olarak kullanıma kapatmak istediğinize emin misiniz?'
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
