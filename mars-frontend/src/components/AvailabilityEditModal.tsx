import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { AVAILABILITY_MESSAGES } from '../constants/availability';
import { FORM_FIELD_CLASS } from '../constants/ui';
import { updateAvailabilitySlot } from '../services/availabilityService';
import type { AvailabilitySlot, AvailabilitySlotUpdatePayload } from '../types/availability';

type AvailabilityEditModalProps = {
  open: boolean;
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

function toTimeInputValue(time: string): string {
  const parts = time.split(':');
  if (parts.length < 2) {
    return time;
  }
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
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
      await updateAvailabilitySlot(slot.slotId, {
        slotDate,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      });
      onUpdated(AVAILABILITY_MESSAGES.UPDATE_SUCCESS);
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setError(backendMessage);
        } else if (err.response?.status === 409) {
          setError('Bu tarih ve saat aralığında çakışan bir ofis saati bulunmaktadır.');
        } else if (err.response?.status === 404) {
          setError('Ofis saati bulunamadı.');
        } else if (err.response?.status === 403) {
          setError(AVAILABILITY_MESSAGES.ACCESS_DENIED);
        } else {
          setError(AVAILABILITY_MESSAGES.UPDATE_ERROR);
        }
      } else {
        setError(AVAILABILITY_MESSAGES.UPDATE_ERROR);
      }
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

        <div className="mt-4 space-y-4 text-left">
          <div className="space-y-1.5">
            <label
              htmlFor="availability-edit-slot-date"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Tarih
            </label>
            <input
              id="availability-edit-slot-date"
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
              htmlFor="availability-edit-start-time"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Başlangıç Saati
            </label>
            <input
              id="availability-edit-start-time"
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
              htmlFor="availability-edit-end-time"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Bitiş Saati
            </label>
            <input
              id="availability-edit-end-time"
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
