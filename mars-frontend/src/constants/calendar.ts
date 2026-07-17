import type { CalendarEvent, CalendarFilter } from '../types/calendar';
import { CALENDAR_FILTER } from '../types/calendar';
import { formatTimeLabel } from './availability';

export const CALENDAR_MESSAGES = {
  TITLE: 'Takvim',
  SUBTITLE: 'Ofis saatlerinizi aylık, haftalık veya günlük görünümde inceleyin.',
  LOAD_ERROR: 'Takvim verileri yüklenemedi. Lütfen tekrar deneyin.',
  ACCESS_DENIED: 'Bu sayfaya erişim yetkiniz yok.',
  EMPTY_RANGE: 'Bu tarih aralığında takvim kaydı bulunmuyor.',
  DETAIL_TITLE: 'Ofis Saati Detayı',
  DETAIL_DESCRIPTION: 'Bu sprintte takvim üzerinden yalnızca görüntüleme yapılabilir.',
  CLOSE: 'Kapat',
} as const;

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
  BLOCKED: '#9CA3AF',
  RECURRING: '#0b1641',
  APPOINTMENT: '#F59E0B',
} as const;

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

export function getCalendarEventColor(event: CalendarEvent): string {
  if (event.eventType === 'APPOINTMENT') {
    return CALENDAR_EVENT_COLORS.APPOINTMENT;
  }
  if (event.isBlocked) {
    return CALENDAR_EVENT_COLORS.BLOCKED;
  }
  if (event.recurrenceRuleId != null) {
    return CALENDAR_EVENT_COLORS.RECURRING;
  }
  return CALENDAR_EVENT_COLORS.NORMAL;
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
  return `${formatTimeLabel(event.startTime)} - ${formatTimeLabel(event.endTime)}`;
}

export function toFullCalendarDateTime(isoDate: string, time: string): string {
  const parts = time.split(':');
  const hours = (parts[0] ?? '00').padStart(2, '0');
  const minutes = (parts[1] ?? '00').padStart(2, '0');
  const seconds = (parts[2] ?? '00').padStart(2, '0');
  return `${isoDate}T${hours}:${minutes}:${seconds}`;
}
