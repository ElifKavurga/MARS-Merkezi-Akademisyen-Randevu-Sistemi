import type {
  StaffAppointment,
  StaffAppointmentScope,
} from '../types/appointment';
import type { AuthUser } from '../types/auth';
import { canDelegateAcademicianAppointment } from '../utils/staffAppointmentPermissions';

export const DELEGATION_MESSAGES = {
  ACTION_LABEL: 'Randevuyu Devret',
  MODAL_TITLE: 'Randevuyu Devret',
  MODAL_DESCRIPTION:
    'Bu randevuyu uygun akademisyen veya araştırma görevlisine yönlendirebilirsiniz.',
  COURSE_LABEL: 'Ders',
  ASSISTANT_LABEL: 'Hedef Personel',
  SUMMARY_LABEL: 'Randevu Devri Özeti',
  SUMMARY_TEXT:
    'Hedef kişi talebi kabul ettikten sonra yalnızca ilgili dersin yetkili araştırma görevlisine yapılan devir doğrudan tamamlanır. Diğer tüm devirlerde öğrencinin iki saat içinde onayı gerekir.',
  SELECT_ASSISTANT: 'Personel seçin',
  SINGLE_ASSISTANT_HINT: 'Derse atanmış tek araştırma görevlisi otomatik seçildi.',
  NO_ASSISTANTS: 'Bu tarih ve saatte uygun hedef personel bulunamadı.',
  ASSISTANTS_LOAD_ERROR: 'Uygun personel listesi yüklenemedi.',
  ASSISTANT_REQUIRED: 'Hedef personel seçimi zorunludur.',
  CONFIRM_LABEL: 'Onayla',
  SUCCESS: 'Randevu devri talebi başarıyla oluşturuldu.',
  ERROR: 'Randevu devri oluşturulamadı. Lütfen tekrar deneyin.',
  LOADING_ASSISTANTS: 'Uygun personeller yükleniyor...',
} as const;

export const INCOMING_DELEGATION_MESSAGES = {
  TITLE: 'Gelen Randevu Devirleri',
  SUBTITLE: 'Size gönderilen bekleyen randevu devri taleplerini görüntüleyin.',
  LOADING: 'Gelen randevu devirleri yükleniyor...',
  LOAD_ERROR: 'Gelen randevu devirleri yüklenirken bir hata oluştu.',
  ACCESS_DENIED: 'Bu sayfayı görüntüleme yetkiniz bulunmuyor.',
  EMPTY_TITLE: 'Bekleyen randevu devri yok',
  EMPTY_DESCRIPTION: 'Şu anda size gönderilmiş bekleyen bir randevu devri talebi bulunmuyor.',
  ACCEPT_LABEL: 'Kabul Et',
  REJECT_LABEL: 'Reddet',
  ACCEPT_SUCCESS: 'Randevu devri kabul edildi. Randevu size aktarıldı.',
  ACADEMICIAN_ACCEPT_SUCCESS:
    'Randevu devri kabul edildi. Talep öğrenci onayına gönderildi.',
  REJECT_SUCCESS: 'Randevu devri reddedildi.',
  ACTION_ERROR: 'İşlem sırasında bir hata oluştu.',
  STATUS_PENDING: 'Bekliyor',
} as const;

export const DELEGATION_HISTORY_MESSAGES = {
  TITLE: 'Randevu Devri',
  SUBTITLE: 'Geçmişte gerçekleşen randevu devri işlemlerini görüntüleyin.',
  LOADING: 'Randevu devri geçmişi yükleniyor...',
  LOAD_ERROR: 'Randevu devri geçmişi yüklenirken bir hata oluştu.',
  ACCESS_DENIED: 'Bu sayfayı görüntüleme yetkiniz bulunmuyor.',
  EMPTY_TITLE: 'Randevu devri geçmişi boş',
  EMPTY_DESCRIPTION: 'Henüz görüntülenecek bir randevu devri kaydı bulunmuyor.',
  EMPTY_FILTER: 'Filtrelere uygun randevu devri kaydı bulunamadı.',
  SEARCH_PLACEHOLDER: 'Akademisyen, araştırma görevlisi veya ders ara...',
  STATUS_FILTER_ALL: 'Tüm durumlar',
  DATE_FROM: 'Başlangıç tarihi',
  DATE_TO: 'Bitiş tarihi',
} as const;

export const DELEGATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  PENDING_ACADEMICIAN_APPROVAL: 'Akademisyen Onayı Bekliyor',
  ACCEPTED: 'Kabul Edildi',
  REJECTED: 'Reddedildi',
  PENDING_STUDENT_APPROVAL: 'Öğrenci Onayı Bekliyor',
  STUDENT_REJECTED: 'Reddedildi',
  EXPIRED: 'Süresi Doldu',
  CANCELLED: 'İptal Edildi',
  COMPLETED: 'Tamamlandı',
};

export function getDelegationStatusLabel(status: string): string {
  return DELEGATION_STATUS_LABELS[status] ?? status;
}

export function canDelegateAppointment(
  appointment: StaffAppointment,
  scope: StaffAppointmentScope,
  user: AuthUser | null | undefined,
): boolean {
  return canDelegateAcademicianAppointment(appointment, scope, user);
}

export function formatCourseLabel(appointment: StaffAppointment): string {
  if (!appointment.courseName) {
    return '-';
  }
  return `${appointment.courseCode ?? ''} ${appointment.courseName}`.trim();
}
