import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { STAFF_APPOINTMENT_MESSAGES, getMeetingTypeLabel } from '../constants/appointment';
import { STUDENT_UI } from '../constants/studentUi';
import {
  getStaffAppointmentRescheduleSlots,
  rescheduleStaffAppointment,
} from '../services/appointmentService';
import type { StaffAppointment } from '../types/appointment';
import type { StudentAvailableSlot } from '../types/studentAppointment';
import { appointmentSlotSelectionKey } from '../utils/appointmentSlot';
import AppointmentSlotPicker from './AppointmentSlotPicker';
import Loading from './Loading';
import ModalShell from './ModalShell';

type AppointmentRescheduleModalProps = {
  appointment: StaffAppointment | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

function durationMinutes(appointment: StaffAppointment): number {
  const [startHour, startMinute] = appointment.startTime.split(':').map(Number);
  const [endHour, endMinute] = appointment.endTime.split(':').map(Number);
  return Math.max(1, endHour * 60 + endMinute - (startHour * 60 + startMinute));
}

export default function AppointmentRescheduleModal({
  appointment,
  open,
  onClose,
  onSuccess,
}: AppointmentRescheduleModalProps) {
  const [slots, setSlots] = useState<StudentAvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<StudentAvailableSlot | null>(null);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    if (!appointment) return;
    setLoading(true);
    setError(null);
    try {
      setSlots(await getStaffAppointmentRescheduleSlots(appointment.appointmentId));
    } catch {
      setSlots([]);
      setError(STAFF_APPOINTMENT_MESSAGES.RESCHEDULE_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [appointment]);

  useEffect(() => {
    if (!open || !appointment) return;
    setSelectedSlot(null);
    setStep('select');
    setError(null);
    void loadSlots();
  }, [open, appointment, loadSlots]);

  const selectedKey = useMemo(
    () => selectedSlot ? appointmentSlotSelectionKey(selectedSlot) : null,
    [selectedSlot],
  );

  if (!appointment) return null;

  const handleConfirm = async () => {
    if (!selectedSlot || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const meetingType = selectedSlot.meetingType === 'BOTH'
        ? appointment.meetingType
        : selectedSlot.meetingType;
      await rescheduleStaffAppointment(appointment.appointmentId, {
        slotId: selectedSlot.slotId,
        appointmentDate: selectedSlot.slotDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        meetingType,
      });
      onSuccess();
    } catch (err) {
      const backendMessage = isAxiosError(err) ? err.response?.data?.message : null;
      const message = typeof backendMessage === 'string' && backendMessage.trim()
        ? backendMessage
        : STAFF_APPOINTMENT_MESSAGES.RESCHEDULE_ERROR;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      titleId="reschedule-modal-title"
      maxWidthClass="sm:max-w-4xl"
      disableBackdropClose={submitting}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 border-t border-outline-variant bg-surface-bright px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" className={STUDENT_UI.SECONDARY_BUTTON_CLASS} disabled={submitting} onClick={step === 'confirm' ? () => { setStep('select'); setError(null); } : onClose}>
            {step === 'confirm' ? 'Geri' : 'İptal'}
          </button>
          {step === 'select' ? (
            <button type="button" className={STUDENT_UI.PRIMARY_BUTTON_CLASS} disabled={!selectedSlot || loading} onClick={() => setStep('confirm')}>
              Devam Et
            </button>
          ) : (
            <button type="button" className={STUDENT_UI.PRIMARY_BUTTON_CLASS} disabled={submitting} onClick={() => void handleConfirm()}>
              {submitting ? <Loading variant="inline" label="Yeniden planlanıyor..." /> : 'Yeniden Planla'}
            </button>
          )}
        </div>
      }
    >
      <div className="bg-surface px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="reschedule-modal-title" className="font-headline-md text-headline-md font-semibold text-on-background">
              {step === 'select' ? STAFF_APPOINTMENT_MESSAGES.RESCHEDULE_TITLE : STAFF_APPOINTMENT_MESSAGES.RESCHEDULE_CONFIRM_TITLE}
            </h2>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              {step === 'select' ? STAFF_APPOINTMENT_MESSAGES.RESCHEDULE_DESCRIPTION : STAFF_APPOINTMENT_MESSAGES.RESCHEDULE_CONFIRM_DESCRIPTION}
            </p>
          </div>
          <button type="button" className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container" aria-label="Kapat" disabled={submitting} onClick={onClose}>
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>

        {step === 'select' ? (
          <div className="mt-5 max-h-[60vh] overflow-y-auto pr-1">
            <AppointmentSlotPicker
              slots={slots}
              selectedKey={selectedKey}
              loading={loading}
              error={error}
              durationMinutes={durationMinutes(appointment)}
              onRetry={() => void loadSlots()}
              onSelect={setSelectedSlot}
              ariaLabel="Yeni randevu zamanı"
            />
          </div>
        ) : selectedSlot ? (
          <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><dt className="font-label-sm text-label-sm text-on-surface-variant">Yeni Tarih</dt><dd className="mt-1 font-body-md font-semibold text-on-surface">{formatDate(selectedSlot.slotDate)}</dd></div>
              <div><dt className="font-label-sm text-label-sm text-on-surface-variant">Yeni Saat</dt><dd className="mt-1 font-body-md font-semibold text-on-surface">{selectedSlot.startTime.slice(0, 5)} – {selectedSlot.endTime.slice(0, 5)}</dd></div>
              <div><dt className="font-label-sm text-label-sm text-on-surface-variant">Görüşme Türü</dt><dd className="mt-1 font-body-md font-semibold text-on-surface">{getMeetingTypeLabel(selectedSlot.meetingType === 'BOTH' ? appointment.meetingType : selectedSlot.meetingType)}</dd></div>
            </dl>
          </div>
        ) : null}

        {step === 'confirm' && error ? <p className="mt-4 font-label-sm text-label-sm text-error" role="alert">{error}</p> : null}
      </div>
    </ModalShell>
  );
}
