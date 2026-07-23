import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import Loading from './Loading';
import ConfirmModal from './ConfirmModal';
import {
  RECURRENCE_MESSAGES,
  REPEAT_TYPE,
  computeWeeklyRepeatCount,
  getWeeklyRecurrenceLabel,
  validateRecurrenceDateRange,
} from '../constants/recurrence';
import { FORM_FIELD_CLASS } from '../constants/ui';
import { getDayOfWeekLabel } from '../constants/availability';
import {
  endRecurrenceRule,
  getRecurrenceRule,
  updateRecurrenceRule,
} from '../services/recurrenceService';
import type { AvailabilitySlot } from '../types/availability';

type RecurrenceRuleEditModalProps = {
  open: boolean;
  recurrenceRuleId: number | null;
  slot: AvailabilitySlot | null;
  onClose: () => void;
  onUpdated: (message: string) => void;
};

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveError(err: unknown): string {
  if (isAxiosError(err)) {
    const backendMessage = err.response?.data?.message;
    if (typeof backendMessage === 'string' && backendMessage.length > 0) {
      return backendMessage;
    }
    if (err.response?.status === 404) {
      return RECURRENCE_MESSAGES.NOT_FOUND;
    }
    if (err.response?.status === 403) {
      return RECURRENCE_MESSAGES.ACCESS_DENIED;
    }
  }
  return RECURRENCE_MESSAGES.UPDATE_ERROR;
}

export default function RecurrenceRuleEditModal({
  open,
  recurrenceRuleId,
  slot,
  onClose,
  onUpdated,
}: RecurrenceRuleEditModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || recurrenceRuleId == null) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setEndConfirmOpen(false);
    setEndError(null);

    void getRecurrenceRule(recurrenceRuleId)
      .then((rule) => {
        if (cancelled) {
          return;
        }
        setStartDate(rule.startDate);
        setEndDate(rule.endDate);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(resolveError(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, recurrenceRuleId]);

  if (!open || recurrenceRuleId == null) {
    return null;
  }

  const dayLabel = slot
    ? getWeeklyRecurrenceLabel(slot.slotDate, getDayOfWeekLabel(slot.slotDate))
    : 'Haftalık tekrar';

  const handleClose = () => {
    if (submitting || loading || ending) {
      return;
    }
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || loading) {
      return;
    }

    setError(null);
    const validationError = validateRecurrenceDateRange({ startDate, endDate });
    if (validationError) {
      setError(validationError);
      return;
    }
    if (startDate.trim() < todayIsoDate()) {
      setError(RECURRENCE_MESSAGES.ONLY_FUTURE_UPDATABLE);
      return;
    }

    setSubmitting(true);
    try {
      await updateRecurrenceRule(recurrenceRuleId, {
        repeatType: REPEAT_TYPE.WEEKLY,
        repeatCount: computeWeeklyRepeatCount(startDate.trim(), endDate.trim()),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      });
      onUpdated(RECURRENCE_MESSAGES.UPDATE_SUCCESS);
      onClose();
    } catch (err) {
      setError(resolveError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndRecurrence = async () => {
    if (ending) {
      return;
    }
    setEnding(true);
    setEndError(null);
    try {
      await endRecurrenceRule(recurrenceRuleId);
      setEndConfirmOpen(false);
      onUpdated(RECURRENCE_MESSAGES.END_SUCCESS);
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setEndError(backendMessage);
        } else if (err.response?.status === 404) {
          setEndError(RECURRENCE_MESSAGES.NOT_FOUND);
        } else if (err.response?.status === 403) {
          setEndError(RECURRENCE_MESSAGES.ACCESS_DENIED);
        } else {
          setEndError(RECURRENCE_MESSAGES.END_ERROR);
        }
      } else {
        setEndError(RECURRENCE_MESSAGES.END_ERROR);
      }
    } finally {
      setEnding(false);
    }
  };

  return (
    <>
      <ModalShell
        open={open}
        titleId="recurrence-rule-edit-modal-title"
        onClose={handleClose}
        onSubmit={(event) => void handleSubmit(event)}
        disableBackdropClose={submitting || loading || ending}
        footer={
          <ModalFormFooter
            submitting={submitting || loading || ending}
            onCancel={handleClose}
            submitLabel="Kaydet"
          />
        }
      >
        <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
          <ModalHeader
            titleId="recurrence-rule-edit-modal-title"
            icon="edit_calendar"
            title="Tekrarlayan Ofis Saatlerini Düzenle"
            description={`${dayLabel} için tarih aralığını güncelleyin veya tekrarı sonlandırın.`}
          />

          {loading ? (
            <div className="mt-6">
              <Loading label="Tekrar kuralı yükleniyor..." />
            </div>
          ) : (
            <div className="mt-4 space-y-4 text-left">
              <div className="rounded-lg border border-outline-variant bg-surface-container/40 px-3 py-2">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Tekrar günü</p>
                <p className="mt-0.5 font-body-md text-body-md text-on-background">{dayLabel}</p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="recurrence-edit-start-date"
                  className="block font-label-md text-label-md text-on-surface-variant"
                >
                  Başlangıç Tarihi
                </label>
                <input
                  id="recurrence-edit-start-date"
                  type="date"
                  className={FORM_FIELD_CLASS}
                  required
                  min={todayIsoDate()}
                  value={startDate}
                  disabled={submitting || ending}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="recurrence-edit-end-date"
                  className="block font-label-md text-label-md text-on-surface-variant"
                >
                  Bitiş Tarihi
                </label>
                <input
                  id="recurrence-edit-end-date"
                  type="date"
                  className={FORM_FIELD_CLASS}
                  required
                  value={endDate}
                  disabled={submitting || ending}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>

              <div className="border-t border-outline-variant pt-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-error px-4 py-2 font-label-md text-label-md text-error transition-colors hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
                  disabled={submitting || ending}
                  onClick={() => {
                    setEndError(null);
                    setEndConfirmOpen(true);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden>
                    event_busy
                  </span>
                  Tekrarı Sonlandır
                </button>
              </div>

              {error ? (
                <p className="font-label-sm text-label-sm text-error" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </ModalShell>

      <ConfirmModal
        open={endConfirmOpen}
        title={RECURRENCE_MESSAGES.END_CONFIRM_TITLE}
        description={RECURRENCE_MESSAGES.END_CONFIRM_DESCRIPTION}
        confirmLabel="Tekrarı Sonlandır"
        loading={ending}
        error={endError}
        variant="danger"
        zIndexClass="z-[60]"
        onConfirm={() => void handleEndRecurrence()}
        onClose={() => {
          if (!ending) {
            setEndConfirmOpen(false);
            setEndError(null);
          }
        }}
      />
    </>
  );
}
