import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import AvailabilitySlotFormFields from './AvailabilitySlotFormFields';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import {
  AVAILABILITY_MESSAGES,
  toApiTimeValue,
  toTimeInputValue,
  validateAvailabilitySlotForm,
} from '../constants/availability';
import { updateAvailabilitySlot } from '../services/availabilityService';
import type { AvailabilitySlot, AvailabilitySlotUpdatePayload } from '../types/availability';

type AvailabilityEditModalProps = {
  open: boolean;
  slot: AvailabilitySlot | null;
  onClose: () => void;
  onUpdated: (message: string) => void;
};

function resolveError(err: unknown): string {
  if (isAxiosError(err)) {
    const backendMessage = err.response?.data?.message;
    if (typeof backendMessage === 'string' && backendMessage.length > 0) {
      return backendMessage;
    }
    if (err.response?.status === 409) {
      return AVAILABILITY_MESSAGES.OVERLAP;
    }
    if (err.response?.status === 404) {
      return AVAILABILITY_MESSAGES.NOT_FOUND;
    }
    if (err.response?.status === 403) {
      return AVAILABILITY_MESSAGES.ACCESS_DENIED;
    }
  }
  return AVAILABILITY_MESSAGES.UPDATE_ERROR;
}

export default function AvailabilityEditModal({
  open,
  slot,
  onClose,
  onUpdated,
}: AvailabilityEditModalProps) {
  const [form, setForm] = useState<AvailabilitySlotUpdatePayload>({
    slotDate: '',
    startTime: '',
    endTime: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slot) {
      return;
    }
    setForm({
      slotDate: slot.slotDate,
      startTime: toTimeInputValue(slot.startTime),
      endTime: toTimeInputValue(slot.endTime),
    });
    setError(null);
  }, [open, slot]);

  if (!open || !slot) {
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
    const validationError = validateAvailabilitySlotForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await updateAvailabilitySlot(slot.slotId, {
        slotDate: form.slotDate.trim(),
        startTime: toApiTimeValue(form.startTime.trim()),
        endTime: toApiTimeValue(form.endTime.trim()),
      });
      onUpdated(AVAILABILITY_MESSAGES.UPDATE_SUCCESS);
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
      titleId="availability-edit-modal-title"
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      disableBackdropClose={submitting}
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="availability-edit-modal-title"
          icon="edit_calendar"
          title="Ofis Saati Düzenle"
          description="Tarih ve saat aralığını güncelleyin."
        />

        <AvailabilitySlotFormFields
          idPrefix="availability-edit"
          form={form}
          disabled={submitting}
          onChange={setForm}
        />

        {error ? (
          <p className="mt-4 font-label-sm text-label-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </ModalShell>
  );
}
