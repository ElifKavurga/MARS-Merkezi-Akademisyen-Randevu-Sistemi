import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import AvailabilitySlotFormFields from './AvailabilitySlotFormFields';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import {
  AVAILABILITY_MESSAGES,
  toApiTimeValue,
  validateAvailabilitySlotForm,
} from '../constants/availability';
import { createAvailabilitySlot } from '../services/availabilityService';
import type { AvailabilitySlotCreatePayload } from '../types/availability';

type AvailabilityCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
};

const INITIAL_FORM: AvailabilitySlotCreatePayload = {
  slotDate: '',
  startTime: '',
  endTime: '',
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
    if (err.response?.status === 403) {
      return AVAILABILITY_MESSAGES.ACCESS_DENIED;
    }
  }
  return AVAILABILITY_MESSAGES.CREATE_ERROR;
}

export default function AvailabilityCreateModal({
  open,
  onClose,
  onCreated,
}: AvailabilityCreateModalProps) {
  const [form, setForm] = useState<AvailabilitySlotCreatePayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({ ...INITIAL_FORM });
    setError(null);
  }, [open]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setForm({ ...INITIAL_FORM });
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
      await createAvailabilitySlot({
        slotDate: form.slotDate.trim(),
        startTime: toApiTimeValue(form.startTime.trim()),
        endTime: toApiTimeValue(form.endTime.trim()),
      });
      setForm({ ...INITIAL_FORM });
      onCreated(AVAILABILITY_MESSAGES.CREATE_SUCCESS);
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
      titleId="availability-create-modal-title"
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      disableBackdropClose={submitting}
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="availability-create-modal-title"
          icon="schedule"
          title="Yeni Ofis Saati"
          description="Tek seferlik müsaitlik aralığı tanımlayın."
        />

        <AvailabilitySlotFormFields
          idPrefix="availability-create"
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
