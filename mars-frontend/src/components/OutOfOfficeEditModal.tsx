import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants';
import { todayIsoDate } from '../constants/availability';
import {
  OUT_OF_OFFICE_MESSAGES,
  REASON_CODE_OPTIONS,
  validateOutOfOfficeUpdateForm,
} from '../constants/outOfOffice';
import { updateOutOfOfficePeriod } from '../services/outOfOfficeService';
import type { OutOfOfficePeriod } from '../types/outOfOffice';

type OutOfOfficeEditModalProps = {
  open: boolean;
  period: OutOfOfficePeriod | null;
  onClose: () => void;
  onUpdated: (message: string) => void;
};

type FormState = {
  startDate: string;
  endDate: string;
  reasonCode: string;
};

function resolveError(err: unknown): string {
  if (isAxiosError(err)) {
    const backendMessage = err.response?.data?.message;
    if (typeof backendMessage === 'string' && backendMessage.length > 0) {
      return backendMessage;
    }
    if (err.response?.status === 409) {
      return OUT_OF_OFFICE_MESSAGES.OVERLAP;
    }
    if (err.response?.status === 403) {
      return OUT_OF_OFFICE_MESSAGES.ACCESS_DENIED;
    }
    if (err.response?.status === 404) {
      return OUT_OF_OFFICE_MESSAGES.NOT_FOUND;
    }
  }
  return OUT_OF_OFFICE_MESSAGES.UPDATE_ERROR;
}

export default function OutOfOfficeEditModal({
  open,
  period,
  onClose,
  onUpdated,
}: OutOfOfficeEditModalProps) {
  const [form, setForm] = useState<FormState>({
    startDate: '',
    endDate: '',
    reasonCode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !period) {
      return;
    }
    setForm({
      startDate: period.startDate,
      endDate: period.endDate,
      reasonCode: period.reasonCode,
    });
    setError(null);
  }, [open, period]);

  if (!open || !period) {
    return null;
  }

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
    const validationError = validateOutOfOfficeUpdateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await updateOutOfOfficePeriod(period.outOfOfficeId, {
        startDate: form.startDate.trim(),
        endDate: form.endDate.trim(),
        reasonCode: form.reasonCode.trim(),
      });
      onUpdated(OUT_OF_OFFICE_MESSAGES.UPDATE_SUCCESS);
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
      titleId="out-of-office-edit-modal-title"
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      disableBackdropClose={submitting}
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="out-of-office-edit-modal-title"
          icon="edit_calendar"
          title={OUT_OF_OFFICE_MESSAGES.EDIT_TITLE}
          description={OUT_OF_OFFICE_MESSAGES.EDIT_DESCRIPTION}
        />

        <div className="mt-4 space-y-4 text-left">
          <div className="space-y-1.5">
            <label
              htmlFor="ooo-edit-start-date"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Başlangıç Tarihi
            </label>
            <input
              id="ooo-edit-start-date"
              type="date"
              className={FORM_FIELD_CLASS}
              required
              value={form.startDate}
              disabled={submitting}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="ooo-edit-end-date"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Bitiş Tarihi
            </label>
            <input
              id="ooo-edit-end-date"
              type="date"
              className={FORM_FIELD_CLASS}
              required
              min={form.startDate || todayIsoDate()}
              value={form.endDate}
              disabled={submitting}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="ooo-edit-reason-code"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Sebep
            </label>
            <select
              id="ooo-edit-reason-code"
              className={FORM_SELECT_CLASS}
              required
              value={form.reasonCode}
              disabled={submitting}
              onChange={(event) => setForm((prev) => ({ ...prev, reasonCode: event.target.value }))}
              aria-label="İzin aralığı sebebi"
            >
              <option value="">Sebep Seçiniz</option>
              {REASON_CODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface-container/40 px-3 py-3">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {OUT_OF_OFFICE_MESSAGES.UPDATE_INFO_CARD}
            </p>
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
