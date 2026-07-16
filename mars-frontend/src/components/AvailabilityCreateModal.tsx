import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { AVAILABILITY_MESSAGES } from '../constants/availability';
import { FORM_FIELD_CLASS } from '../constants/ui';
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

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

    const slotDate = form.slotDate.trim();
    const startTime = form.startTime.trim();
    const endTime = form.endTime.trim();

    if (!slotDate) {
      setError('Tarih zorunludur.');
      return;
    }
    if (!startTime) {
      setError('Başlangıç saati zorunludur.');
      return;
    }
    if (!endTime) {
      setError('Bitiş saati zorunludur.');
      return;
    }
    if (slotDate < todayIsoDate()) {
      setError('Geçmiş tarih seçilemez.');
      return;
    }
    if (startTime >= endTime) {
      setError('Başlangıç saati bitiş saatinden önce olmalıdır.');
      return;
    }

    setSubmitting(true);
    try {
      await createAvailabilitySlot({
        slotDate,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      });
      setForm({ ...INITIAL_FORM });
      onCreated(AVAILABILITY_MESSAGES.CREATE_SUCCESS);
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setError(backendMessage);
        } else if (err.response?.status === 409) {
          setError('Bu tarih ve saat aralığında çakışan bir ofis saati bulunmaktadır.');
        } else if (err.response?.status === 403) {
          setError(AVAILABILITY_MESSAGES.ACCESS_DENIED);
        } else {
          setError(AVAILABILITY_MESSAGES.CREATE_ERROR);
        }
      } else {
        setError(AVAILABILITY_MESSAGES.CREATE_ERROR);
      }
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

        <div className="mt-4 space-y-4 text-left">
          <div className="space-y-1.5">
            <label
              htmlFor="availability-slot-date"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Tarih
            </label>
            <input
              id="availability-slot-date"
              type="date"
              className={FORM_FIELD_CLASS}
              required
              min={todayIsoDate()}
              value={form.slotDate}
              disabled={submitting}
              onChange={(event) => setForm((prev) => ({ ...prev, slotDate: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="availability-start-time"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Başlangıç Saati
            </label>
            <input
              id="availability-start-time"
              type="time"
              className={FORM_FIELD_CLASS}
              required
              value={form.startTime}
              disabled={submitting}
              onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="availability-end-time"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Bitiş Saati
            </label>
            <input
              id="availability-end-time"
              type="time"
              className={FORM_FIELD_CLASS}
              required
              value={form.endTime}
              disabled={submitting}
              onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
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
