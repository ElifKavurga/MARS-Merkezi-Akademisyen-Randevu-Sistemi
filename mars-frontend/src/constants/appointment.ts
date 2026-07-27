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

export const STAFF_APPOINTMENT_MESSAGES = {
  TITLE: 'Randevularım',
  SUBTITLE: 'Size gelen randevu taleplerini ve randevu geçmişinizi görüntüleyin.',
  PENDING_TAB: 'Gelen Talepler',
  ALL_TAB: 'Tümü',
  PENDING_EMPTY: 'Bekleyen randevu talebiniz bulunmuyor.',
  ALL_EMPTY: 'Henüz size oluşturulmuş bir randevu bulunmuyor.',
  LOAD_ERROR: 'Randevular yüklenirken bir hata oluştu.',
  ACCESS_DENIED: 'Bu sayfayı görüntüleme yetkiniz bulunmuyor.',
  DETAIL_TITLE: 'Randevu Detayı',
  APPROVE_TITLE: 'Randevu Talebini Onayla',
  APPROVE_DESCRIPTION: 'Bu randevu talebini onaylamak istediğinize emin misiniz?',
  APPROVE_SUCCESS: 'Randevu talebi başarıyla onaylandı.',
  REJECT_TITLE: 'Randevu Talebini Reddet',
  REJECT_DESCRIPTION: 'Bu randevu talebini reddetmek istediğinize emin misiniz?',
  REJECT_SUCCESS: 'Randevu talebi reddedildi.',
  RESCHEDULE_TITLE: 'Randevuyu Yeniden Planla',
  RESCHEDULE_DESCRIPTION: 'Akademisyenin müsait ofis saatlerinden yeni bir tarih ve saat seçin.',
  RESCHEDULE_CONFIRM_TITLE: 'Yeni Randevu Zamanını Onayla',
  RESCHEDULE_CONFIRM_DESCRIPTION: 'Randevuyu seçtiğiniz yeni tarih ve saate taşımak istediğinize emin misiniz?',
  RESCHEDULE_SUCCESS: 'Randevu başarıyla yeniden planlandı.',
  RESCHEDULE_LOAD_ERROR: 'Uygun ofis saatleri yüklenirken bir hata oluştu.',
  RESCHEDULE_ERROR: 'Randevu yeniden planlanırken bir hata oluştu. Mevcut bilgiler korunmuştur.',
  RESCHEDULE_NOT_ALLOWED: 'Seçilen zaman artık müsait değil veya randevu yeniden planlanamıyor. Mevcut bilgiler korunmuştur.',
  ACTION_NOT_FOUND: 'Randevu bulunamadı.',
  ACTION_ACCESS_DENIED: 'Bu randevu üzerinde işlem yapma yetkiniz yok.',
  ACTION_NOT_PENDING: 'Randevu artık beklemede değil.',
  ACTION_ERROR: 'İşlem sırasında beklenmeyen bir hata oluştu.',
  // Academician appointments page — 6 status tabs
  TAB_PENDING: 'Bekleyen',
  TAB_APPROVED: 'Onaylanan',
  TAB_REJECTED: 'Reddedilen',
  TAB_COMPLETED: 'Tamamlanan',
  TAB_NO_SHOW: 'No-Show',
  TAB_CANCELLED: 'İptal Edilen',
  EMPTY_PENDING: 'Bekleyen randevu talebiniz bulunmuyor.',
  EMPTY_APPROVED: 'Onaylanmış randevunuz bulunmuyor.',
  EMPTY_REJECTED: 'Reddedilmiş randevu talebiniz bulunmuyor.',
  EMPTY_COMPLETED: 'Tamamlanmış randevunuz bulunmuyor.',
  EMPTY_NO_SHOW: 'No-Show randevunuz bulunmuyor.',
  EMPTY_CANCELLED: 'İptal edilen randevunuz bulunmuyor.',
  SEARCH_PLACEHOLDER: 'Öğrenci adı ile ara...',
  SEARCH_LABEL: 'Öğrenci adı',
  SORT_LABEL: 'Sırala',
  SORT_DATE_ASC: 'Tarihe Göre (Yakın → Uzak)',
  SORT_DATE_DESC: 'Tarihe Göre (Uzak → Yakın)',
  SORT_CREATED_DESC: 'En Yeni',
  SORT_CREATED_ASC: 'En Eski',
  VIEW_DETAIL: 'Detayları Gör',
  LOADING: 'Randevular yükleniyor...',
  RETRY: 'Tekrar Dene',
  DURATION_MIN: 'dk',
} as const;

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  COMPLETED: 'Tamamlandı',
  NO_SHOW: 'Katılım Sağlanmadı',
  CANCELLED: 'İptal Edildi',
  CANCELLED_BY_STUDENT: 'Öğrenci Tarafından İptal Edildi',
  CANCELLED_BY_ACADEMICIAN: 'Akademisyen Tarafından İptal Edildi',
  WAITING: 'Bekleme Listesinde',
  WAITLIST: 'Bekleme Listesinde',
  EXPIRED: 'Süresi Doldu',
  DELEGATION_PENDING: 'Randevu Devri Bekliyor',
  RESCHEDULE_PENDING: 'Yeniden Planlama Bekliyor',
};

export function getAppointmentStatusLabel(status: string): string {
  const normalizedStatus = status.trim().toUpperCase();
  return APPOINTMENT_STATUS_LABELS[normalizedStatus] ?? status;
}

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
