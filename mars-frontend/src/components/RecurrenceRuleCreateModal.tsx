import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import {
  RECURRENCE_MESSAGES,
  REPEAT_TYPE,
  computeWeeklyRepeatCount,
  getWeeklyRecurrenceLabel,
  validateRecurrenceDateRange,
} from '../constants/recurrence';
import { FORM_FIELD_CLASS } from '../constants/ui';
import { getDayOfWeekLabel } from '../constants/availability';
import { createRecurrenceRule } from '../services/recurrenceService';
import type { AvailabilitySlot } from '../types/availability';

type RecurrenceRuleCreateModalProps = {
  open: boolean;
  slot: AvailabilitySlot | null;
  onClose: () => void;
  onCreated: (message: string) => void;
};

function resolveError(err: unknown): string {
  if (isAxiosError(err)) {
    const backendMessage = err.response?.data?.message;
    if (typeof backendMessage === 'string' && backendMessage.length > 0) {
      return backendMessage;
    }
    if (err.response?.status === 409) {
      return RECURRENCE_MESSAGES.ALREADY_EXISTS;
    }
    if (err.response?.status === 403) {
      return RECURRENCE_MESSAGES.ACCESS_DENIED;
    }
  }
  return RECURRENCE_MESSAGES.CREATE_ERROR;
}

export default function RecurrenceRuleCreateModal({
  open,
  slot,
  onClose,
  onCreated,
}: RecurrenceRuleCreateModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slot) {
      return;
    }
    setStartDate(slot.slotDate);
    setEndDate(slot.slotDate);
    setError(null);
  }, [open, slot]);

  if (!open || !slot) {
    return null;
  }

  const dayLabel = getWeeklyRecurrenceLabel(slot.slotDate, getDayOfWeekLabel(slot.slotDate));

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError(null);
    const validationError = validateRecurrenceDateRange({ startDate, endDate });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await createRecurrenceRule(slot.slotId, {
        repeatType: REPEAT_TYPE.WEEKLY,
        repeatCount: computeWeeklyRepeatCount(startDate.trim(), endDate.trim()),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      });
      onCreated(RECURRENCE_MESSAGES.CREATE_SUCCESS);
      onClose();
    } catch (err) {
      setError(resolveError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      titleId="recurrence-rule-create-modal-title"
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      disableBackdropClose={submitting}
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="recurrence-rule-create-modal-title"
          icon="event_repeat"
          title="Haftalık Tekrar Oluştur"
          description={`${dayLabel} için tekrar aralığını belirleyin.`}
        />

        <div className="mt-4 space-y-4 text-left">
          <div className="rounded-lg border border-outline-variant bg-surface-container/40 px-3 py-2">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Tekrar günü</p>
            <p className="mt-0.5 font-body-md text-body-md text-on-background">{dayLabel}</p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="recurrence-start-date"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Başlangıç Tarihi
            </label>
            <input
              id="recurrence-start-date"
              type="date"
              className={FORM_FIELD_CLASS}
              required
              value={startDate}
              disabled={submitting}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="recurrence-end-date"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Bitiş Tarihi
            </label>
            <input
              id="recurrence-end-date"
              type="date"
              className={FORM_FIELD_CLASS}
              required
              value={endDate}
              disabled={submitting}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          {error ? (
            <p className="font-label-sm text-label-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}
