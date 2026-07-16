export type CalendarEvent = {
  slotId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  recurrenceRuleId: number | null;
  isBlocked: boolean;
};

export const CALENDAR_FILTER = {
  ALL: 'ALL',
  ONE_TIME: 'ONE_TIME',
  RECURRING: 'RECURRING',
  BLOCKED: 'BLOCKED',
} as const;

export type CalendarFilter = (typeof CALENDAR_FILTER)[keyof typeof CALENDAR_FILTER];

export type CalendarDateRange = {
  from: string;
  to: string;
};
