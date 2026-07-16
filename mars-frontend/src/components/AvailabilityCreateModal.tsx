import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import AvailabilityCreateFormFields, {
  type AvailabilityCreateFormValues,
} from './AvailabilityCreateFormFields';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import {
  AVAILABILITY_MESSAGES,
  OFFICE_HOUR_TYPE,
  RECURRENCE_END_MODE,
  formatCreateSuccessMessage,
  toApiTimeValue,
  validateAvailabilityCreateForm,
} from '../constants/availability';
import { createAvailabilitySlots } from '../services/availabilityService';
import type { AvailabilitySlotCreatePayload } from '../types/availability';

type AvailabilityCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
};

const INITIAL_FORM: AvailabilityCreateFormValues = {
  slotType: OFFICE_HOUR_TYPE.ONE_TIME,
  slotDate: '',
  daysOfWeek: [],
  startTime: '',
  endTime: '',
  recurrenceEndMode: RECURRENCE_END_MODE.TERM_END,
  recurrenceEndDate: '',
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

function toCreatePayload(form: AvailabilityCreateFormValues): AvailabilitySlotCreatePayload {
  const startTime = toApiTimeValue(form.startTime.trim());
  const endTime = toApiTimeValue(form.endTime.trim());

  if (form.slotType === OFFICE_HOUR_TYPE.ONE_TIME) {
    return {
      slotType: OFFICE_HOUR_TYPE.ONE_TIME,
      slotDate: form.slotDate.trim(),
      daysOfWeek: null,
      startTime,
      endTime,
      recurrenceEndMode: null,
      recurrenceEndDate: null,
    };
  }

  return {
    slotType: OFFICE_HOUR_TYPE.RECURRING,
    slotDate: null,
    daysOfWeek: form.daysOfWeek,
    startTime,
    endTime,
    recurrenceEndMode: form.recurrenceEndMode,
    recurrenceEndDate:
      form.recurrenceEndMode === RECURRENCE_END_MODE.UNTIL_DATE
        ? form.recurrenceEndDate.trim()
        : null,
  };
}

export default function AvailabilityCreateModal({
  open,
  onClose,
  onCreated,
}: AvailabilityCreateModalProps) {
  const [form, setForm] = useState<AvailabilityCreateFormValues>(INITIAL_FORM);
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
    const validationError = validateAvailabilityCreateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAvailabilitySlots(toCreatePayload(form));
      setForm({ ...INITIAL_FORM });
      onCreated(formatCreateSuccessMessage(created.length));
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
      maxWidthClass="sm:max-w-xl"
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="availability-create-modal-title"
          icon="schedule"
          title="Yeni Ofis Saati"
          description="Tek seferlik veya haftalık tekrarlayan ofis saati tanımlayın."
        />

        <AvailabilityCreateFormFields
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
