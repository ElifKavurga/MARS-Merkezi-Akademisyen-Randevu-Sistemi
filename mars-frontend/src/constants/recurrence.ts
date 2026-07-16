export const REPEAT_TYPE = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  CUSTOM: 'CUSTOM',
} as const;

export type RepeatType = (typeof REPEAT_TYPE)[keyof typeof REPEAT_TYPE];

export const RECURRENCE_MESSAGES = {
  CREATE_SUCCESS: 'Haftalık tekrar kuralı başarıyla oluşturuldu.',
  CREATE_ERROR: 'Tekrar kuralı oluşturulamadı. Lütfen tekrar deneyin.',
  UPDATE_SUCCESS: 'Haftalık tekrar kuralı başarıyla güncellendi.',
  UPDATE_ERROR: 'Tekrar kuralı güncellenemedi. Lütfen tekrar deneyin.',
  END_SUCCESS: 'Haftalık tekrar kuralı sonlandırıldı.',
  END_ERROR: 'Tekrar kuralı sonlandırılamadı. Lütfen tekrar deneyin.',
  ACCESS_DENIED: 'Bu işlem için yetkiniz yok.',
  NOT_FOUND: 'Tekrar kuralı bulunamadı.',
  ALREADY_EXISTS: 'Bu ofis saati için zaten bir tekrar kuralı tanımlanmıştır.',
  START_DATE_REQUIRED: 'Başlangıç tarihi zorunludur.',
  END_DATE_REQUIRED: 'Bitiş tarihi zorunludur.',
  INVALID_DATE_RANGE: 'Bitiş tarihi başlangıç tarihinden önce olamaz.',
  ONLY_FUTURE_UPDATABLE: 'Güncelleme yalnızca gelecek tarihli tekrarlar için yapılabilir.',
  END_CONFIRM_TITLE: 'Tekrarı Sonlandır',
  END_CONFIRM_DESCRIPTION:
    'Bu ofis saatinin haftalık tekrarını sonlandırmak istediğinize emin misiniz?\n\nMevcut kayıt korunacaktır. Bundan sonra yeni tekrar oluşturulmayacaktır.',
} as const;

export function computeWeeklyRepeatCount(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1;
  }
  const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

export function getWeeklyRecurrenceLabel(slotDate: string, dayLabel: string): string {
  if (!slotDate || !dayLabel || dayLabel === '-') {
    return 'Haftalık tekrar';
  }
  return `Her ${dayLabel}`;
}

export function validateRecurrenceDateRange(form: {
  startDate: string;
  endDate: string;
}): string | null {
  const startDate = form.startDate.trim();
  const endDate = form.endDate.trim();

  if (!startDate) {
    return RECURRENCE_MESSAGES.START_DATE_REQUIRED;
  }
  if (!endDate) {
    return RECURRENCE_MESSAGES.END_DATE_REQUIRED;
  }
  if (endDate < startDate) {
    return RECURRENCE_MESSAGES.INVALID_DATE_RANGE;
  }
  return null;
}
