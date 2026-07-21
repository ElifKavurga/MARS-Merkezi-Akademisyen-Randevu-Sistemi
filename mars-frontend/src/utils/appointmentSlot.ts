import type { StudentAvailableSlot } from '../types/studentAppointment';

export function appointmentSlotSelectionKey(
  slot: Pick<StudentAvailableSlot, 'slotId' | 'slotDate' | 'startTime'>,
): string {
  return `${slot.slotId}|${slot.slotDate}|${slot.startTime}`;
}
