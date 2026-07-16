export type AvailabilitySlot = {
  slotId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  recurrenceRuleId: number | null;
  isBlocked: boolean;
  meetingType: string;
};

export type AvailabilitySlotCreatePayload = {
  slotType: 'ONE_TIME' | 'RECURRING';
  slotDate?: string | null;
  daysOfWeek?: number[] | null;
  startTime: string;
  endTime: string;
  recurrenceEndMode?: string | null;
  recurrenceEndDate?: string | null;
  meetingType?: string | null;
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
