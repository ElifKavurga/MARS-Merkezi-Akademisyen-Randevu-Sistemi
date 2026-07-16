export type AvailabilitySlot = {
  slotId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  recurrenceRuleId: number | null;
  isBlocked: boolean;
};

export type AvailabilitySlotCreatePayload = {
  slotDate: string;
  startTime: string;
  endTime: string;
};

export type AvailabilitySlotUpdatePayload = {
  slotDate: string;
  startTime: string;
  endTime: string;
};

export type AvailabilitySlotBlockPayload = {
  isBlocked: boolean;
};

export type AvailabilitySlotStats = {
  totalSlotCount: number;
  availableSlotCount: number;
  blockedSlotCount: number;
  thisWeekSlotCount: number;
};

export type AvailabilityStatusFilter = 'AVAILABLE' | 'BLOCKED' | 'ALL';
