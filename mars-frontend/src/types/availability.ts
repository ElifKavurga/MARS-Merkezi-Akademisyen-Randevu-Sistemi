export type AvailabilitySlot = {
  slotId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
};

export type AvailabilitySlotCreatePayload = {
  slotDate: string;
  startTime: string;
  endTime: string;
};

export type AvailabilityStatusFilter = 'ACTIVE' | 'BLOCKED' | 'ALL';
