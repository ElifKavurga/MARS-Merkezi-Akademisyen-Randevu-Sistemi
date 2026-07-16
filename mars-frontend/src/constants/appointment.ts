import {
  APPOINTMENT_MEETING_TYPE_OPTIONS,
  MEETING_TYPE,
} from './availability';

export const APPOINTMENT_MESSAGES = {
  TITLE: 'Randevu Talebi Oluştur',
  SUBTITLE: 'Uygun ofis saatini seçerek randevu talebi oluşturun.',
  SELECT_STAFF: 'Akademisyen seçiniz',
  EMPTY_SLOTS: 'Seçilen akademisyen için uygun ofis saati bulunamadı.',
  LOAD_ERROR: 'Veriler yüklenemedi. Lütfen tekrar deneyin.',
  ACCESS_DENIED: 'Bu işlem için yetkiniz yok.',
  CREATE_TITLE: 'Randevu Talebi',
  CREATE_SUCCESS: 'Randevu talebiniz başarıyla oluşturuldu.',
  CREATE_ERROR: 'Randevu talebi oluşturulamadı. Lütfen tekrar deneyin.',
  CATEGORY_REQUIRED: 'Randevu kategorisi zorunludur.',
  MEETING_TYPE_REQUIRED: 'Görüşme tipi seçimi zorunludur.',
  SLOT_REQUIRED: 'Ofis saati seçimi zorunludur.',
  FACE_TO_FACE_INFO: 'Bu ofis saati yalnızca yüz yüze görüşme içindir.',
  ONLINE_INFO: 'Bu ofis saati yalnızca online görüşme içindir.',
  BOTH_INFO: 'Görüşme tipini seçiniz.',
  REQUEST_BUTTON: 'Randevu Talep Et',
} as const;

export function getMeetingTypeLabel(meetingType: string): string {
  const option = APPOINTMENT_MEETING_TYPE_OPTIONS.find((item) => item.value === meetingType)
    ?? (meetingType === MEETING_TYPE.BOTH
      ? { value: MEETING_TYPE.BOTH, label: 'Yüz Yüze / Online' }
      : null);
  return option?.label ?? meetingType;
}

export function resolveAppointmentMeetingType(
  slotMeetingType: string,
  selectedMeetingType: string,
): string | null {
  if (slotMeetingType === MEETING_TYPE.FACE_TO_FACE) {
    return MEETING_TYPE.FACE_TO_FACE;
  }
  if (slotMeetingType === MEETING_TYPE.ONLINE) {
    return MEETING_TYPE.ONLINE;
  }
  if (slotMeetingType === MEETING_TYPE.BOTH) {
    if (
      selectedMeetingType !== MEETING_TYPE.FACE_TO_FACE
      && selectedMeetingType !== MEETING_TYPE.ONLINE
    ) {
      return null;
    }
    return selectedMeetingType;
  }
  return MEETING_TYPE.FACE_TO_FACE;
}

export function validateAppointmentCreateForm(form: {
  categoryId: string;
  meetingType: string;
  slotMeetingType: string;
}): string | null {
  if (!form.categoryId.trim()) {
    return APPOINTMENT_MESSAGES.CATEGORY_REQUIRED;
  }
  if (form.slotMeetingType === MEETING_TYPE.BOTH && !form.meetingType.trim()) {
    return APPOINTMENT_MESSAGES.MEETING_TYPE_REQUIRED;
  }
  return null;
}
