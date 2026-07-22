import { todayIsoDate } from './availability';

export const OUT_OF_OFFICE_MESSAGES = {
  TITLE: 'İzin Aralıkları',
  SUBTITLE: 'Tanımlı izin aralıklarınızı görüntüleyin.',
  EMPTY: 'Henüz izin aralığı tanımlanmamış.',
  LOAD_ERROR: 'İzin aralıkları yüklenemedi. Lütfen tekrar deneyin.',
  ACCESS_DENIED: 'Bu sayfaya erişim yetkiniz yok.',
  NO_ACTIONS: '—',
  CREATE_BUTTON: 'İzin Aralığı Oluştur',
  CREATE_TITLE: 'İzin Aralığı Oluştur',
  CREATE_DESCRIPTION: 'İzinli olduğunuz tarih aralığını tanımlayın.',
  CREATE_SUCCESS: 'İzin aralığı başarıyla oluşturuldu.',
  CREATE_ERROR: 'İzin aralığı oluşturulamadı. Lütfen tekrar deneyin.',
  EDIT_TITLE: 'İzin Aralığını Güncelle',
  EDIT_DESCRIPTION: 'İzin aralığının tarihlerini ve sebebini güncelleyin.',
  UPDATE_SUCCESS: 'İzin aralığı başarıyla güncellendi.',
  UPDATE_ERROR: 'İzin aralığı güncellenemedi. Lütfen tekrar deneyin.',
  END_SUCCESS: 'İzin aralığı sonlandırıldı.',
  END_ERROR: 'İzin aralığı sonlandırılamadı. Lütfen tekrar deneyin.',
  END_CONFIRM_TITLE: 'İzin Aralığını Sil',
  END_CONFIRM_DESCRIPTION:
    'Bu işlem sonrasında ilgili tarih aralığındaki uygun ofis saatleri tekrar kullanılabilir hale gelebilir. Devam etmek istediğinize emin misiniz?',
  NOT_FOUND: 'İzin aralığı bulunamadı.',
  ALREADY_ENDED: 'Bu izin aralığı daha önce sonlandırılmıştır.',
  PAST_PERIOD_NOT_ENDABLE: 'Geçmişte tamamen bitmiş izin aralıkları için işlem yapılamaz.',
  PAST_PERIOD_NOT_UPDATABLE: 'Geçmişte tamamen bitmiş izin aralıkları güncellenemez.',
  OVERLAP: 'Bu tarih aralığında çakışan bir izin aralığı bulunmaktadır.',
  ACTIVE_APPOINTMENTS:
    'Bu tarih aralığındaki ofis saatlerinde bekleyen veya onaylı randevu bulunduğu için izin aralığı oluşturulamaz.',
  INFO_CARD:
    'Bu tarih aralığında bulunan uygun ofis saatleri otomatik olarak kullanıma kapatılacaktır.',
  UPDATE_INFO_CARD:
    'Değişiklik kaydedildiğinde ilgili ofis saatleri yeniden değerlendirilecektir.',
  START_REQUIRED: 'Başlangıç tarihi zorunludur.',
  END_REQUIRED: 'Bitiş tarihi zorunludur.',
  REASON_REQUIRED: 'Sebep zorunludur.',
  INVALID_DATE_RANGE: 'Başlangıç tarihi bitiş tarihinden sonra olamaz.',
  PAST_DATE: 'Geçmiş tarih için izin aralığı oluşturulamaz.',
} as const;

export const REASON_CODE = {
  CONFERENCE: 'CONFERENCE',
  LEAVE: 'LEAVE',
  ASSIGNMENT: 'ASSIGNMENT',
  OTHER: 'OTHER',
} as const;

export type ReasonCode = (typeof REASON_CODE)[keyof typeof REASON_CODE];

export const REASON_CODE_OPTIONS = [
  { value: REASON_CODE.CONFERENCE, label: 'Konferans' },
  { value: REASON_CODE.LEAVE, label: 'İzin' },
  { value: REASON_CODE.ASSIGNMENT, label: 'Görevlendirme' },
  { value: REASON_CODE.OTHER, label: 'Diğer' },
] as const;

export const REASON_CODE_LABELS: Record<string, string> = {
  CONFERENCE: 'Konferans',
  LEAVE: 'İzin',
  ASSIGNMENT: 'Görevlendirme',
  OTHER: 'Diğer',
};

export function getReasonCodeLabel(reasonCode: string): string {
  return REASON_CODE_LABELS[reasonCode] ?? reasonCode;
}

export function formatOutOfOfficeDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function validateOutOfOfficeCreateForm(form: {
  startDate: string;
  endDate: string;
  reasonCode: string;
}): string | null {
  const startDate = form.startDate.trim();
  const endDate = form.endDate.trim();
  const reasonCode = form.reasonCode.trim();

  if (!startDate) {
    return OUT_OF_OFFICE_MESSAGES.START_REQUIRED;
  }
  if (!endDate) {
    return OUT_OF_OFFICE_MESSAGES.END_REQUIRED;
  }
  if (!reasonCode) {
    return OUT_OF_OFFICE_MESSAGES.REASON_REQUIRED;
  }
  if (startDate < todayIsoDate()) {
    return OUT_OF_OFFICE_MESSAGES.PAST_DATE;
  }
  if (startDate > endDate) {
    return OUT_OF_OFFICE_MESSAGES.INVALID_DATE_RANGE;
  }
  return null;
}

export function validateOutOfOfficeUpdateForm(form: {
  startDate: string;
  endDate: string;
  reasonCode: string;
}): string | null {
  const startDate = form.startDate.trim();
  const endDate = form.endDate.trim();
  const reasonCode = form.reasonCode.trim();

  if (!startDate) {
    return OUT_OF_OFFICE_MESSAGES.START_REQUIRED;
  }
  if (!endDate) {
    return OUT_OF_OFFICE_MESSAGES.END_REQUIRED;
  }
  if (!reasonCode) {
    return OUT_OF_OFFICE_MESSAGES.REASON_REQUIRED;
  }
  if (startDate > endDate) {
    return OUT_OF_OFFICE_MESSAGES.INVALID_DATE_RANGE;
  }
  return null;
}

export function isOutOfOfficePeriodFullyPast(endDate: string): boolean {
  return endDate < todayIsoDate();
}

export function canEndOutOfOfficePeriod(endDate: string): boolean {
  return endDate > todayIsoDate();
}
