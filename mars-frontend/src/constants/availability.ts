export const AVAILABILITY_STATUS_FILTER = {
  AVAILABLE: 'AVAILABLE',
  BLOCKED: 'BLOCKED',
  ALL: 'ALL',
} as const;

export const AVAILABILITY_SORT_FIELD = {
  SLOT_DATE: 'slotDate',
  START_TIME: 'startTime',
  END_TIME: 'endTime',
} as const;

export type AvailabilitySortField =
  (typeof AVAILABILITY_SORT_FIELD)[keyof typeof AVAILABILITY_SORT_FIELD];

export const RECURRENCE_END_MODE = {
  TERM_END: 'TERM_END',
  UNTIL_DATE: 'UNTIL_DATE',
} as const;

export type RecurrenceEndMode = (typeof RECURRENCE_END_MODE)[keyof typeof RECURRENCE_END_MODE];

export const OFFICE_HOUR_TYPE = {
  ONE_TIME: 'ONE_TIME',
  RECURRING: 'RECURRING',
} as const;

export type OfficeHourType = (typeof OFFICE_HOUR_TYPE)[keyof typeof OFFICE_HOUR_TYPE];

export const MEETING_TYPE = {
  FACE_TO_FACE: 'FACE_TO_FACE',
  ONLINE: 'ONLINE',
  BOTH: 'BOTH',
} as const;

export type MeetingType = (typeof MEETING_TYPE)[keyof typeof MEETING_TYPE];

export const MEETING_TYPE_OPTIONS = [
  { value: MEETING_TYPE.FACE_TO_FACE, label: 'Yüz Yüze' },
  { value: MEETING_TYPE.ONLINE, label: 'Online' },
  { value: MEETING_TYPE.BOTH, label: 'Her İkisi' },
] as const;

export const APPOINTMENT_MEETING_TYPE_OPTIONS = [
  { value: MEETING_TYPE.FACE_TO_FACE, label: 'Yüz Yüze' },
  { value: MEETING_TYPE.ONLINE, label: 'Online' },
] as const;

export const APPOINTMENT_DURATION_MINUTES = 10;
export const TIME_MINUTE_STEP = 10;
export const TIME_MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50] as const;

/** ISO DayOfWeek values: Monday=1 … Friday=5 (backend DayOfWeek). */
export const OFFICE_WEEKDAY_OPTIONS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
] as const;

export const AVAILABILITY_MESSAGES = {
  EMPTY_TITLE: 'Henüz tanımlanmış ofis saati bulunmamaktadır.',
  EMPTY_FILTER: 'Seçili filtreye uygun ofis saati bulunamadı.',
  EMPTY_CTA: 'Yeni Ofis Saati Oluştur',
  LOAD_ERROR: 'Ofis saatleri yüklenemedi. Lütfen tekrar deneyin.',
  ACCESS_DENIED: 'Bu sayfaya erişim yetkiniz yok.',
  NOT_FOUND: 'Ofis saati bulunamadı.',
  CREATE_SUCCESS: 'Ofis saati başarıyla oluşturuldu.',
  CREATE_ERROR: 'Ofis saati oluşturulamadı. Lütfen tekrar deneyin.',
  UPDATE_SUCCESS: 'Ofis saati başarıyla güncellendi.',
  UPDATE_ERROR: 'Ofis saati güncellenemedi. Lütfen tekrar deneyin.',
  BLOCK_SUCCESS: 'Ofis saati kullanıma kapatıldı.',
  UNBLOCK_SUCCESS: 'Ofis saati kullanıma açıldı.',
  BLOCK_ERROR: 'Ofis saati durumu güncellenemedi. Lütfen tekrar deneyin.',
  OVERLAP: 'Bu tarih ve saat aralığında çakışan bir ofis saati bulunmaktadır.',
  DATE_REQUIRED: 'Tarih zorunludur.',
  DAYS_REQUIRED: 'En az bir gün seçilmelidir.',
  MEETING_TYPE_REQUIRED: 'Görüşme tipi zorunludur.',
  START_REQUIRED: 'Başlangıç saati zorunludur.',
  END_REQUIRED: 'Bitiş saati zorunludur.',
  PAST_DATE: 'Geçmiş tarih seçilemez.',
  START_BEFORE_END: 'Başlangıç saati bitiş saatinden önce olmalıdır.',
  INVALID_MINUTE_STEP:
    'Saat seçimleri yalnızca 10 dakikalık aralıklarla yapılabilir (00, 10, 20, 30, 40, 50).',
  RECURRENCE_END_DATE_REQUIRED: 'Bitiş tarihi zorunludur.',
  RECURRING_BADGE: 'Tekrarlayan',
  BLOCK_CONFIRM_TITLE: 'Ofis Saatini Kullanıma Kapat',
  BLOCK_CONFIRM_DESCRIPTION:
    'Bu ofis saatini geçici olarak kullanıma kapatmak istediğinize emin misiniz?',
  UNBLOCK_CONFIRM_TITLE: 'Ofis Saatini Kullanıma Aç',
  UNBLOCK_CONFIRM_DESCRIPTION:
    'Bu ofis saatini tekrar kullanılabilir hale getirmek istediğinize emin misiniz?',
} as const;

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  0: 'Pazar',
};

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(time: string): string {
  const parts = time.split(':');
  if (parts.length < 2) {
    return time;
  }
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

export function toApiTimeValue(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export function isValidMinuteStep(time: string): boolean {
  const parts = time.split(':').map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return false;
  }
  return parts[1] % TIME_MINUTE_STEP === 0;
}

export function buildOfficeHourTimeOptions(minHour = 8, maxHour = 22): string[] {
  const options: string[] = [];
  for (let hour = minHour; hour <= maxHour; hour += 1) {
    for (const minute of TIME_MINUTE_OPTIONS) {
      if (hour === maxHour && minute > 0) {
        break;
      }
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return options;
}

export function computeTotalDurationMinutes(startTime: string, endTime: string): number {
  return getDurationMinutes(startTime, endTime);
}

export function computeAppointmentSlotCount(startTime: string, endTime: string): number {
  const total = computeTotalDurationMinutes(startTime, endTime);
  if (total <= 0) {
    return 0;
  }
  return Math.floor(total / APPOINTMENT_DURATION_MINUTES);
}

/** Mirrors backend AcademicTermCalendar.resolveCurrentTermEndDate. */
export function resolveCurrentTermEndDateIso(referenceDate: Date = new Date()): string {
  const month = referenceDate.getMonth() + 1;
  const year = referenceDate.getFullYear();

  let end: Date;
  if (month >= 9) {
    end = new Date(year + 1, 0, 31);
  } else if (month === 1) {
    end = new Date(year, 0, 31);
  } else if (month <= 6) {
    end = new Date(year, 5, 30);
  } else {
    end = new Date(year, 7, 31);
  }

  const y = end.getFullYear();
  const m = String(end.getMonth() + 1).padStart(2, '0');
  const d = String(end.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTermEndDateLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function validateAvailabilityCreateForm(form: {
  slotType: OfficeHourType;
  slotDate: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  recurrenceEndMode: RecurrenceEndMode;
  recurrenceEndDate: string;
  meetingType: string;
}): string | null {
  const startTime = form.startTime.trim();
  const endTime = form.endTime.trim();

  if (!form.meetingType.trim()) {
    return AVAILABILITY_MESSAGES.MEETING_TYPE_REQUIRED;
  }

  if (form.slotType === OFFICE_HOUR_TYPE.ONE_TIME) {
    const slotDate = form.slotDate.trim();
    if (!slotDate) {
      return AVAILABILITY_MESSAGES.DATE_REQUIRED;
    }
    if (slotDate < todayIsoDate()) {
      return AVAILABILITY_MESSAGES.PAST_DATE;
    }
  } else if (!form.daysOfWeek.length) {
    return AVAILABILITY_MESSAGES.DAYS_REQUIRED;
  }

  if (!startTime) {
    return AVAILABILITY_MESSAGES.START_REQUIRED;
  }
  if (!endTime) {
    return AVAILABILITY_MESSAGES.END_REQUIRED;
  }
  if (!isValidMinuteStep(startTime) || !isValidMinuteStep(endTime)) {
    return AVAILABILITY_MESSAGES.INVALID_MINUTE_STEP;
  }
  if (startTime >= endTime) {
    return AVAILABILITY_MESSAGES.START_BEFORE_END;
  }
  if (
    form.slotType === OFFICE_HOUR_TYPE.RECURRING
    && form.recurrenceEndMode === RECURRENCE_END_MODE.UNTIL_DATE
  ) {
    const endDate = form.recurrenceEndDate.trim();
    if (!endDate) {
      return AVAILABILITY_MESSAGES.RECURRENCE_END_DATE_REQUIRED;
    }
    if (endDate < todayIsoDate()) {
      return AVAILABILITY_MESSAGES.PAST_DATE;
    }
  }
  return null;
}

export function validateAvailabilitySlotForm(form: {
  slotDate: string;
  startTime: string;
  endTime: string;
}): string | null {
  const slotDate = form.slotDate.trim();
  const startTime = form.startTime.trim();
  const endTime = form.endTime.trim();

  if (!slotDate) {
    return AVAILABILITY_MESSAGES.DATE_REQUIRED;
  }
  if (!startTime) {
    return AVAILABILITY_MESSAGES.START_REQUIRED;
  }
  if (!endTime) {
    return AVAILABILITY_MESSAGES.END_REQUIRED;
  }
  if (slotDate < todayIsoDate()) {
    return AVAILABILITY_MESSAGES.PAST_DATE;
  }
  if (!isValidMinuteStep(startTime) || !isValidMinuteStep(endTime)) {
    return AVAILABILITY_MESSAGES.INVALID_MINUTE_STEP;
  }
  if (startTime >= endTime) {
    return AVAILABILITY_MESSAGES.START_BEFORE_END;
  }
  return null;
}

export function getDayOfWeekLabel(slotDate: string): string {
  const date = new Date(`${slotDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return DAY_OF_WEEK_LABELS[date.getDay()] ?? '-';
}

export function getDayOfWeekValue(slotDate: string): number {
  const date = new Date(`${slotDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return -1;
  }
  return date.getDay();
}

export function getDurationMinutes(startTime: string, endTime: string): number {
  const startParts = startTime.split(':').map(Number);
  const endParts = endTime.split(':').map(Number);
  if (startParts.length < 2 || endParts.length < 2) {
    return 0;
  }
  const startMinutes = startParts[0] * 60 + startParts[1];
  const endMinutes = endParts[0] * 60 + endParts[1];
  return Math.max(0, endMinutes - startMinutes);
}

export function formatTimeLabel(time: string): string {
  const parts = time.split(':');
  if (parts.length < 2) {
    return time;
  }
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

export function formatCreateSuccessMessage(count: number): string {
  if (count > 1) {
    return `${count} ofis saati başarıyla oluşturuldu.`;
  }
  return AVAILABILITY_MESSAGES.CREATE_SUCCESS;
}
