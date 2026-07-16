export type AvailabilitySlot = {
  slotId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
};

export type AvailabilityStatusFilter = 'ACTIVE' | 'BLOCKED' | 'ALL';
