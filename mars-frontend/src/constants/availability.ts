export const AVAILABILITY_STATUS_FILTER = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
  ALL: 'ALL',
} as const;

export const AVAILABILITY_MESSAGES = {
  EMPTY_TITLE: 'Henüz tanımlanmış ofis saati bulunmamaktadır.',
  EMPTY_FILTER: 'Seçili filtreye uygun ofis saati bulunamadı.',
  LOAD_ERROR: 'Ofis saatleri yüklenemedi. Lütfen tekrar deneyin.',
  ACCESS_DENIED: 'Bu sayfaya erişim yetkiniz yok.',
  CREATE_SUCCESS: 'Ofis saati başarıyla oluşturuldu.',
  CREATE_ERROR: 'Ofis saati oluşturulamadı. Lütfen tekrar deneyin.',
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
