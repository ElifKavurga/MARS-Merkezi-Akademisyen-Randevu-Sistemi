import { useMemo } from 'react';
import { getMeetingTypeLabel } from '../constants/appointment';
import { STUDENT_APPOINTMENT_MESSAGES } from '../constants/studentAppointment';
import type { StudentAvailableSlot } from '../types/studentAppointment';
import { appointmentSlotSelectionKey } from '../utils/appointmentSlot';
import StudentEmptyState from './StudentEmptyState';
import StudentErrorState from './StudentErrorState';
import StudentLoadingState from './StudentLoadingState';

type AppointmentSlotPickerProps = {
  slots: StudentAvailableSlot[];
  selectedKey: string | null;
  loading: boolean;
  error: string | null;
  durationMinutes: number;
  onRetry: () => void;
  onSelect: (slot: StudentAvailableSlot) => void;
  ariaLabel?: string;
};

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export default function AppointmentSlotPicker({
  slots,
  selectedKey,
  loading,
  error,
  durationMinutes,
  onRetry,
  onSelect,
  ariaLabel = STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_TITLE,
}: AppointmentSlotPickerProps) {
  const groupedSlots = useMemo(() => {
    const byDate = new Map<string, StudentAvailableSlot[]>();
    for (const slot of slots) {
      const dateSlots = byDate.get(slot.slotDate) ?? [];
      dateSlots.push(slot);
      byDate.set(slot.slotDate, dateSlots);
    }
    return Array.from(byDate.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, dateSlots]) => ({
        date,
        slots: [...dateSlots].sort((left, right) =>
          left.startTime.localeCompare(right.startTime),
        ),
      }));
  }, [slots]);

  if (loading) {
    return <StudentLoadingState label={STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_LOADING} compact />;
  }

  if (error) {
    return <StudentErrorState message={error} onRetry={onRetry} />;
  }

  if (slots.length === 0) {
    return (
      <StudentEmptyState
        icon="event_busy"
        title={STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_EMPTY_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_EMPTY_DESCRIPTION}
        className="border-0 bg-surface px-4 py-8"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5" role="radiogroup" aria-label={ariaLabel}>
      {groupedSlots.map((group) => (
        <div key={group.date} className="min-w-0 rounded-lg border border-outline-variant/80 bg-surface px-3 py-3">
          <h3 className="mb-2 font-label-md text-label-md font-semibold text-on-surface">
            {formatDate(group.date)}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.slots.map((slot) => {
              const key = appointmentSlotSelectionKey(slot);
              const selected = selectedKey === key;
              const isBooked = slot.isBooked === true;

              if (isBooked) {
                return (
                  <div
                    key={key}
                    aria-disabled="true"
                    className="relative flex min-w-0 cursor-not-allowed select-none flex-col gap-1 rounded-xl border border-outline-variant/60 bg-neutral-100 p-3 text-left opacity-60"
                  >
                    <div className="flex w-full items-center justify-between gap-1.5">
                      <span className="font-body-md text-body-md font-bold text-neutral-400 line-through">
                        {formatTime(slot.startTime)}
                      </span>
                      <span className="material-symbols-outlined shrink-0 text-[16px] text-neutral-400" aria-hidden>
                        lock
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-label-sm text-[12px] text-neutral-400">
                        {STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_DURATION(durationMinutes)} · {getMeetingTypeLabel(slot.meetingType)}
                      </span>
                      <span className="inline-flex rounded-md bg-neutral-200 px-1.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Dolu
                      </span>
                    </div>
                    <span className="sr-only">{formatTime(slot.startTime)} - Dolu.</span>
                  </div>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(slot)}
                  className={`flex w-full min-w-0 cursor-pointer flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-1 hover:scale-[1.02] ${
                    selected
                      ? 'scale-[1.02] border-2 border-primary bg-primary-fixed text-on-primary-fixed shadow-sm'
                      : 'border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1.5">
                    <span className={`font-body-md text-body-md font-semibold ${selected ? 'text-on-primary-fixed' : 'text-on-surface'}`}>
                      {formatTime(slot.startTime)}
                    </span>
                    <span className={`material-symbols-outlined shrink-0 text-[16px] ${selected ? 'text-on-primary-fixed' : 'text-primary'}`} aria-hidden>
                      event_available
                    </span>
                  </div>
                  <span className={`font-label-sm text-label-sm ${selected ? 'text-on-primary-fixed-variant' : 'text-on-surface-variant'}`}>
                    {STUDENT_APPOINTMENT_MESSAGES.STEP_SLOT_DURATION(durationMinutes)} · {getMeetingTypeLabel(slot.meetingType)}
                  </span>
                  <span className="sr-only">{formatTime(slot.startTime)} - Müsait.</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
