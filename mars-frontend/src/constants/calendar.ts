import type { CalendarEvent, CalendarFilter } from '../types/calendar';
import { CALENDAR_FILTER } from '../types/calendar';
import { formatTimeLabel } from './availability';
import { STUDENT_APPOINTMENT_STATUS_EVENT_COLORS } from './studentAppointment';

export const CALENDAR_MESSAGES = {
  TITLE: 'Takvim',
  SUBTITLE: 'Müsaitliklerinizi ve size ait randevuları aylık, haftalık veya günlük görünümde inceleyin.',
  LOAD_ERROR: 'Takvim verileri yüklenemedi. Lütfen tekrar deneyin.',
  ACCESS_DENIED: 'Bu sayfaya erişim yetkiniz yok.',
  EMPTY_RANGE: 'Bu tarih aralığında takvim kaydı bulunmuyor.',
  DETAIL_TITLE: 'Ofis Saati Detayı',
  DETAIL_DESCRIPTION: 'Bu sprintte takvim üzerinden yalnızca görüntüleme yapılabilir.',
  APPOINTMENT_DETAIL_TITLE: 'Randevu Detayı',
  APPOINTMENT_DETAIL_DESCRIPTION: 'Seçilen randevunun özet bilgileri.',
  CLOSE: 'Kapat',
  LEGEND_AVAILABILITY: 'Müsaitlik (boş)',
  LEGEND_RECURRING: 'Tekrarlayan müsaitlik',
  LEGEND_BLOCKED: 'Engellenmiş',
  LEGEND_APPOINTMENT: 'Randevu (kompakt kart)',
  LEGEND_BUSY: 'Dolu süre (arka plan)',
  VIEW_LIST: 'Liste',
  VIEW_CALENDAR: 'Takvim',
  VIEW_MODE_LABEL: 'Görünüm',
  LIST_EMPTY_TITLE: 'Randevu bulunamadı',
  LIST_EMPTY_DESCRIPTION:
    'Seçili tarih aralığında listelenecek randevu kaydı yok.',
  RANGE_PREV: 'Önceki dönem',
  RANGE_NEXT: 'Sonraki dönem',
  RANGE_LABEL: 'Tarih aralığı',
} as const;

/** Appointment chips stay compact; longer bookings show a busy background lane. */
export const APPOINTMENT_VISUAL_MAX_MINUTES = 45;

export const CALENDAR_FILTER_OPTIONS = [
  { value: CALENDAR_FILTER.ALL, label: 'Tümü' },
  { value: CALENDAR_FILTER.ONE_TIME, label: 'Tek Seferlik' },
  { value: CALENDAR_FILTER.RECURRING, label: 'Tekrarlayan' },
  { value: CALENDAR_FILTER.BLOCKED, label: 'Engellenmiş' },
] as const;

export const STAFF_CALENDAR_FILTER_OPTIONS = [
  { value: CALENDAR_FILTER.ALL, label: 'Tümü' },
  { value: CALENDAR_FILTER.AVAILABILITY, label: 'Müsaitlikler' },
  { value: CALENDAR_FILTER.APPOINTMENT, label: 'Randevular' },
  { value: CALENDAR_FILTER.ONE_TIME, label: 'Tek Seferlik' },
  { value: CALENDAR_FILTER.RECURRING, label: 'Tekrarlayan' },
  { value: CALENDAR_FILTER.BLOCKED, label: 'Engellenmiş' },
] as const;

/** Kurumsal tema ile uyumlu mevcut renkler (yeni palet değil). */
export const CALENDAR_EVENT_COLORS = {
  NORMAL: '#3B82F6',
  NORMAL_SOFT: 'rgba(59, 130, 246, 0.16)',
  BLOCKED: '#9CA3AF',
  BLOCKED_SOFT: 'rgba(156, 163, 175, 0.35)',
  RECURRING: '#0b1641',
  RECURRING_SOFT: 'rgba(11, 22, 65, 0.12)',
  APPOINTMENT: '#D97706',
} as const;

export type CalendarEventStyle = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames: string[];
};

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function exclusiveEndToInclusiveIso(endExclusive: Date): string {
  const inclusive = new Date(endExclusive);
  inclusive.setDate(inclusive.getDate() - 1);
  return toLocalIsoDate(inclusive);
}

/** @deprecated Prefer getCalendarEventStyle for UI rendering. */
export function getCalendarEventColor(event: CalendarEvent): string {
  return getCalendarEventStyle(event).borderColor;
}

/** Availability = soft fill; appointments = solid status color. */
export function getCalendarEventStyle(event: CalendarEvent): CalendarEventStyle {
  if (event.eventType === 'APPOINTMENT') {
    const color =
      STUDENT_APPOINTMENT_STATUS_EVENT_COLORS[event.appointmentStatus ?? '']
      ?? STUDENT_APPOINTMENT_STATUS_EVENT_COLORS.DEFAULT;
    return {
      backgroundColor: color,
      borderColor: color,
      textColor: '#ffffff',
      classNames: ['mars-cal-event', 'mars-cal-event--appointment'],
    };
  }
  if (event.isBlocked) {
    return {
      backgroundColor: CALENDAR_EVENT_COLORS.BLOCKED_SOFT,
      borderColor: CALENDAR_EVENT_COLORS.BLOCKED,
      textColor: '#374151',
      classNames: ['mars-cal-event', 'mars-cal-event--availability', 'mars-cal-event--blocked'],
    };
  }
  if (event.recurrenceRuleId != null) {
    return {
      backgroundColor: CALENDAR_EVENT_COLORS.RECURRING_SOFT,
      borderColor: CALENDAR_EVENT_COLORS.RECURRING,
      textColor: '#0b1641',
      classNames: ['mars-cal-event', 'mars-cal-event--availability', 'mars-cal-event--recurring'],
    };
  }
  return {
    backgroundColor: CALENDAR_EVENT_COLORS.NORMAL_SOFT,
    borderColor: CALENDAR_EVENT_COLORS.NORMAL,
    textColor: '#1e3a5f',
    classNames: ['mars-cal-event', 'mars-cal-event--availability'],
  };
}

export function matchesCalendarFilter(event: CalendarEvent, filter: CalendarFilter): boolean {
  switch (filter) {
    case CALENDAR_FILTER.ONE_TIME:
      return event.eventType === 'AVAILABILITY' && event.recurrenceRuleId == null;
    case CALENDAR_FILTER.RECURRING:
      return event.eventType === 'AVAILABILITY' && event.recurrenceRuleId != null;
    case CALENDAR_FILTER.BLOCKED:
      return event.eventType === 'AVAILABILITY' && Boolean(event.isBlocked);
    case CALENDAR_FILTER.AVAILABILITY:
      return event.eventType === 'AVAILABILITY';
    case CALENDAR_FILTER.APPOINTMENT:
      return event.eventType === 'APPOINTMENT';
    case CALENDAR_FILTER.ALL:
    default:
      return true;
  }
}

/** List view: only real Appointment records — never AvailabilitySlot. */
export function isCalendarAppointment(event: CalendarEvent): boolean {
  return event.eventType === 'APPOINTMENT';
}

export function getMeetingTypeIcon(meetingType: string): string {
  if (meetingType === 'ONLINE') {
    return 'videocam';
  }
  if (meetingType === 'FACE_TO_FACE') {
    return 'groups';
  }
  return 'devices';
}

export function formatCalendarDateLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCalendarEventTitle(event: CalendarEvent): string {
  const time = `${formatTimeLabel(event.startTime)} - ${formatTimeLabel(event.endTime)}`;
  if (event.eventType === 'APPOINTMENT') {
    return `${time} · ${event.studentName?.trim() || 'Öğrenci'}`;
  }
  return time;
}

export function toFullCalendarDateTime(isoDate: string, time: string): string {
  const parts = time.split(':');
  const hours = (parts[0] ?? '00').padStart(2, '0');
  const minutes = (parts[1] ?? '00').padStart(2, '0');
  const seconds = (parts[2] ?? '00').padStart(2, '0');
  return `${isoDate}T${hours}:${minutes}:${seconds}`;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60 - 1));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

export function getAppointmentDurationMinutes(event: CalendarEvent): number {
  return Math.max(
    0,
    parseTimeToMinutes(event.endTime) - parseTimeToMinutes(event.startTime),
  );
}

/** Time-grid visual end: appointments capped so chips stay compact. */
export function getCalendarVisualEndTime(event: CalendarEvent): string {
  if (event.eventType !== 'APPOINTMENT') {
    const parts = event.endTime.split(':');
    const hours = (parts[0] ?? '00').padStart(2, '0');
    const minutes = (parts[1] ?? '00').padStart(2, '0');
    const seconds = (parts[2] ?? '00').padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  const start = parseTimeToMinutes(event.startTime);
  const duration = getAppointmentDurationMinutes(event);
  const visualMinutes = duration <= 0
    ? APPOINTMENT_VISUAL_MAX_MINUTES
    : Math.min(duration, APPOINTMENT_VISUAL_MAX_MINUTES);
  return minutesToTime(start + visualMinutes);
}

export function shouldRenderAppointmentBusyLane(event: CalendarEvent): boolean {
  return (
    event.eventType === 'APPOINTMENT'
    && getAppointmentDurationMinutes(event) > APPOINTMENT_VISUAL_MAX_MINUTES
  );
}

export function formatCalendarTimeRange(event: CalendarEvent): string {
  return `${formatTimeLabel(event.startTime)} - ${formatTimeLabel(event.endTime)}`;
}

export function compareCalendarEvents(left: CalendarEvent, right: CalendarEvent): number {
  const byDate = left.slotDate.localeCompare(right.slotDate);
  if (byDate !== 0) {
    return byDate;
  }
  const byStart = left.startTime.localeCompare(right.startTime);
  if (byStart !== 0) {
    return byStart;
  }
  return left.eventType.localeCompare(right.eventType);
}

export function shiftCalendarRange(
  range: { from: string; to: string },
  dayDelta: number,
): { from: string; to: string } {
  const fromDate = new Date(`${range.from}T00:00:00`);
  const toDate = new Date(`${range.to}T00:00:00`);
  fromDate.setDate(fromDate.getDate() + dayDelta);
  toDate.setDate(toDate.getDate() + dayDelta);
  return {
    from: toLocalIsoDate(fromDate),
    to: toLocalIsoDate(toDate),
  };
}

export function formatCalendarRangeLabel(range: { from: string; to: string }): string {
  const from = formatCalendarDateLabel(range.from);
  if (range.from === range.to) {
    return from;
  }
  const to = formatCalendarDateLabel(range.to);
  return `${from} – ${to}`;
}

function withAlpha(hexOrRgba: string, alpha: number): string {
  if (hexOrRgba.startsWith('rgba')) {
    return hexOrRgba;
  }
  if (!hexOrRgba.startsWith('#') || (hexOrRgba.length !== 7 && hexOrRgba.length !== 4)) {
    return hexOrRgba;
  }
  const hex = hexOrRgba.length === 4
    ? `#${hexOrRgba[1]}${hexOrRgba[1]}${hexOrRgba[2]}${hexOrRgba[2]}${hexOrRgba[3]}${hexOrRgba[3]}`
    : hexOrRgba;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getAppointmentBusyLaneColor(event: CalendarEvent): string {
  const style = getCalendarEventStyle(event);
  return withAlpha(style.backgroundColor, 0.22);
}
