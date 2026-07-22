import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import Loading from '../components/Loading';
import OutOfOfficeCreateModal from '../components/OutOfOfficeCreateModal';
import OutOfOfficeEditModal from '../components/OutOfOfficeEditModal';
import {
  OUT_OF_OFFICE_MESSAGES,
  canEndOutOfOfficePeriod,
  formatOutOfOfficeDate,
  getReasonCodeLabel,
  isOutOfOfficePeriodFullyPast,
} from '../constants/outOfOffice';
import { useToast } from '../hooks/useToast';
import {
  endOutOfOfficePeriod,
  getMyOutOfOfficePeriods,
} from '../services/outOfOfficeService';
import type { OutOfOfficePeriod } from '../types/outOfOffice';

export default function AcademicianOutOfOfficePage() {
  const toast = useToast();
  const [periods, setPeriods] = useState<OutOfOfficePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<OutOfOfficePeriod | null>(null);
  const [endingPeriod, setEndingPeriod] = useState<OutOfOfficePeriod | null>(null);
  const [endLoading, setEndLoading] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyOutOfOfficePeriods();
      setPeriods(data);
    } catch (err) {
      if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        setError(OUT_OF_OFFICE_MESSAGES.ACCESS_DENIED);
        toast.error(OUT_OF_OFFICE_MESSAGES.ACCESS_DENIED);
      } else {
        setError(OUT_OF_OFFICE_MESSAGES.LOAD_ERROR);
        toast.error(OUT_OF_OFFICE_MESSAGES.LOAD_ERROR);
      }
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  const handleConfirmEnd = async () => {
    if (!endingPeriod || endLoading) {
      return;
    }
    setEndLoading(true);
    setEndError(null);
    try {
      await endOutOfOfficePeriod(endingPeriod.outOfOfficeId);
      setEndingPeriod(null);
      toast.success(OUT_OF_OFFICE_MESSAGES.END_SUCCESS);
      void loadPeriods();
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const message =
          typeof err.response?.data?.message === 'string'
            ? err.response.data.message
            : null;
        if (status === 401 || status === 403) {
          setEndError(OUT_OF_OFFICE_MESSAGES.ACCESS_DENIED);
        } else if (status === 404) {
          setEndError(message ?? OUT_OF_OFFICE_MESSAGES.NOT_FOUND);
        } else if (status === 409) {
          setEndError(message ?? OUT_OF_OFFICE_MESSAGES.ALREADY_ENDED);
        } else if (status === 400) {
          setEndError(message ?? OUT_OF_OFFICE_MESSAGES.PAST_PERIOD_NOT_ENDABLE);
        } else {
          setEndError(message ?? OUT_OF_OFFICE_MESSAGES.END_ERROR);
        }
      } else {
        setEndError(OUT_OF_OFFICE_MESSAGES.END_ERROR);
      }
    } finally {
      setEndLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background">
            {OUT_OF_OFFICE_MESSAGES.TITLE}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {OUT_OF_OFFICE_MESSAGES.SUBTITLE}
          </p>
        </div>
        <button
          type="button"
          className="bg-[#0b1641] text-white px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-[#152a5c] transition-colors flex items-center gap-2 shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            add
          </span>
          {OUT_OF_OFFICE_MESSAGES.CREATE_BUTTON}
        </button>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loading label="İzin aralıkları yükleniyor..." />
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-body-md text-body-md text-error" role="alert">
              {error}
            </p>
          </div>
        ) : periods.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span
              className="material-symbols-outlined text-[40px] text-on-surface-variant/50"
              aria-hidden="true"
            >
              event_busy
            </span>
            <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
              {OUT_OF_OFFICE_MESSAGES.EMPTY}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/40">
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-left">
                    Başlangıç Tarihi
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-left">
                    Bitiş Tarihi
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-left">
                    Sebep
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => {
                  const fullyPast = isOutOfOfficePeriodFullyPast(period.endDate);
                  const canEnd = canEndOutOfOfficePeriod(period.endDate);
                  return (
                    <tr
                      key={period.outOfOfficeId}
                      className="border-b border-outline-variant/40 hover:bg-surface-container/30 transition-colors"
                    >
                      <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                        {formatOutOfOfficeDate(period.startDate)}
                      </td>
                      <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                        {formatOutOfOfficeDate(period.endDate)}
                      </td>
                      <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                        {getReasonCodeLabel(period.reasonCode)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {fullyPast ? (
                          <span className="font-body-md text-body-md text-on-surface-variant">
                            {OUT_OF_OFFICE_MESSAGES.NO_ACTIONS}
                          </span>
                        ) : (
                          <div className="flex flex-wrap justify-end gap-2">
                            <AdminActionButton
                              variant="primary"
                              icon="edit"
                              onClick={() => setEditingPeriod(period)}
                            >
                              İzin Aralığını Güncelle
                            </AdminActionButton>
                            {canEnd ? (
                              <AdminActionButton
                                variant="danger"
                                icon="event_busy"
                                onClick={() => {
                                  setEndError(null);
                                  setEndingPeriod(period);
                                }}
                              >
                                İzin Aralığını Sil
                              </AdminActionButton>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OutOfOfficeCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(message) => {
          toast.success(message);
          void loadPeriods();
        }}
      />

      <OutOfOfficeEditModal
        open={editingPeriod !== null}
        period={editingPeriod}
        onClose={() => setEditingPeriod(null)}
        onUpdated={(message) => {
          toast.success(message);
          void loadPeriods();
        }}
      />

      <ConfirmModal
        open={endingPeriod !== null}
        title={OUT_OF_OFFICE_MESSAGES.END_CONFIRM_TITLE}
        description={OUT_OF_OFFICE_MESSAGES.END_CONFIRM_DESCRIPTION}
        confirmLabel="İzin Aralığını Sil"
        cancelLabel="İptal"
        loading={endLoading}
        error={endError}
        variant="danger"
        onConfirm={() => void handleConfirmEnd()}
        onClose={() => {
          if (endLoading) {
            return;
          }
          setEndError(null);
          setEndingPeriod(null);
        }}
      />
    </div>
  );
}
