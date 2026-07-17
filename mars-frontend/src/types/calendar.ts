export type CalendarEvent = {
  eventType: 'AVAILABILITY' | 'APPOINTMENT';
  slotId: number;
  appointmentId: number | null;
  slotDate: string;
  startTime: string;
  endTime: string;
  recurrenceRuleId: number | null;
  isBlocked: boolean | null;
  meetingType: 'FACE_TO_FACE' | 'ONLINE' | 'BOTH';
  studentName: string | null;
  categoryName: string | null;
  courseCode: string | null;
  courseName: string | null;
  appointmentStatus: string | null;
};

export const CALENDAR_FILTER = {
  ALL: 'ALL',
  ONE_TIME: 'ONE_TIME',
  RECURRING: 'RECURRING',
  BLOCKED: 'BLOCKED',
  AVAILABILITY: 'AVAILABILITY',
  APPOINTMENT: 'APPOINTMENT',
} as const;

export type CalendarFilter = (typeof CALENDAR_FILTER)[keyof typeof CALENDAR_FILTER];

export type CalendarDateRange = {
  from: string;
  to: string;
};
