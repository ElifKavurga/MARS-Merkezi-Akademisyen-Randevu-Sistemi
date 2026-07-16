import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { FORM_SELECT_CLASS } from '../constants/ui';
import {
  APPOINTMENT_MESSAGES,
  getMeetingTypeLabel,
  resolveAppointmentMeetingType,
  validateAppointmentCreateForm,
} from '../constants/appointment';
import {
  APPOINTMENT_MEETING_TYPE_OPTIONS,
  MEETING_TYPE,
} from '../constants/availability';
import { createAppointment } from '../services/appointmentService';
import type { AvailableSlot } from '../types/appointment';
import type { AppointmentCategory } from '../types/category';

type AppointmentCreateModalProps = {
  open: boolean;
  slot: AvailableSlot | null;
  categories: AppointmentCategory[];
  onClose: () => void;
  onCreated: (message: string) => void;
};

export default function AppointmentCreateModal({
  open,
  slot,
  categories,
  onClose,
  onCreated,
}: AppointmentCreateModalProps) {
  const [categoryId, setCategoryId] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slot) {
      return;
    }
    setCategoryId('');
    setMeetingType('');
    setError(null);
  }, [open, slot]);

  if (!open || !slot) {
    return null;
  }

  const handleClose = () => {
    if (submitting) {
      return;
    }
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const validationError = validateAppointmentCreateForm({
      categoryId,
      meetingType,
      slotMeetingType: slot.meetingType,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    const resolvedMeetingType = resolveAppointmentMeetingType(slot.meetingType, meetingType);
    if (!resolvedMeetingType) {
      setError(APPOINTMENT_MESSAGES.MEETING_TYPE_REQUIRED);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createAppointment({
        slotId: slot.slotId,
        categoryId: Number(categoryId),
        meetingType: resolvedMeetingType,
        isLimitedDuration: false,
      });
      onCreated(APPOINTMENT_MESSAGES.CREATE_SUCCESS);
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const message = err.response?.data?.message;
        if (typeof message === 'string' && message.length > 0) {
          setError(message);
        } else if (err.response?.status === 403) {
          setError(APPOINTMENT_MESSAGES.ACCESS_DENIED);
        } else {
          setError(APPOINTMENT_MESSAGES.CREATE_ERROR);
        }
      } else {
        setError(APPOINTMENT_MESSAGES.CREATE_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      titleId="appointment-create-modal-title"
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      disableBackdropClose={submitting}
      maxWidthClass="sm:max-w-lg"
      footer={
        <ModalFormFooter
          submitting={submitting}
          onCancel={handleClose}
          submitLabel="Talep Oluştur"
        />
      }
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="appointment-create-modal-title"
          icon="event_available"
          title={APPOINTMENT_MESSAGES.CREATE_TITLE}
          description={`${slot.staffName} · ${slot.slotDate} · ${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`}
        />

        <div className="mt-4 space-y-4 text-left">
          <div className="space-y-1.5">
            <label
              htmlFor="appointment-category"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Kategori
            </label>
            <select
              id="appointment-category"
              className={FORM_SELECT_CLASS}
              required
              value={categoryId}
              disabled={submitting}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Seçiniz</option>
              {categories
                .filter((category) => !category.requiresCourseSelection)
                .map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName} ({category.durationMinutes} dk)
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="font-label-md text-label-md text-on-surface-variant">Görüşme Tipi</p>
            {slot.meetingType === MEETING_TYPE.FACE_TO_FACE ? (
              <p className="rounded-lg border border-outline-variant bg-surface-container/40 px-3 py-2 font-body-md text-body-md text-on-background">
                {APPOINTMENT_MESSAGES.FACE_TO_FACE_INFO}
              </p>
            ) : null}
            {slot.meetingType === MEETING_TYPE.ONLINE ? (
              <p className="rounded-lg border border-outline-variant bg-surface-container/40 px-3 py-2 font-body-md text-body-md text-on-background">
                {APPOINTMENT_MESSAGES.ONLINE_INFO}
              </p>
            ) : null}
            {slot.meetingType === MEETING_TYPE.BOTH ? (
              <fieldset className="space-y-2">
                <legend className="sr-only">{APPOINTMENT_MESSAGES.BOTH_INFO}</legend>
                {APPOINTMENT_MEETING_TYPE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      className="accent-[#0b1641]"
                      name="appointment-meeting-type"
                      value={option.value}
                      checked={meetingType === option.value}
                      disabled={submitting}
                      onChange={() => setMeetingType(option.value)}
                    />
                    <span className="font-body-md text-body-md text-on-background">{option.label}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Atanacak tip: {getMeetingTypeLabel(
                  slot.meetingType === MEETING_TYPE.BOTH
                    ? meetingType
                    : slot.meetingType === MEETING_TYPE.ONLINE
                      ? MEETING_TYPE.ONLINE
                      : MEETING_TYPE.FACE_TO_FACE,
                )}
              </p>
            )}
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
