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
  BLOCK_SUCCESS: 'Ofis saati engellendi.',
  UNBLOCK_SUCCESS: 'Ofis saati engeli kaldırıldı.',
  BLOCK_ERROR: 'Ofis saati durumu güncellenemedi. Lütfen tekrar deneyin.',
  OVERLAP: 'Bu tarih ve saat aralığında çakışan bir ofis saati bulunmaktadır.',
  DATE_REQUIRED: 'Tarih zorunludur.',
  START_REQUIRED: 'Başlangıç saati zorunludur.',
  END_REQUIRED: 'Bitiş saati zorunludur.',
  PAST_DATE: 'Geçmiş tarih seçilemez.',
  START_BEFORE_END: 'Başlangıç saati bitiş saatinden önce olmalıdır.',
  BLOCK_CONFIRM_TITLE: 'Ofis Saatini Engelle',
  BLOCK_CONFIRM_DESCRIPTION:
    'Bu ofis saatini geçici olarak kullanıma kapatmak istediğinize emin misiniz?',
  UNBLOCK_CONFIRM_TITLE: 'Ofis Saatini Yeniden Aktif Et',
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
