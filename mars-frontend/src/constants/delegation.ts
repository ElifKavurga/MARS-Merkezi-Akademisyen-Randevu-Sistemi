import type { AuthUser } from '../types/auth';
import type {
  AppointmentStatus,
  StaffAppointment,
  StaffAppointmentScope,
} from '../types/appointment';

export const DELEGATION_MESSAGES = {
  ACTION_LABEL: 'Devret',
  MODAL_TITLE: 'Randevuyu Devret',
  MODAL_DESCRIPTION:
    'Bu randevuyu uygun akademisyen veya asistana yönlendirebilirsiniz.',
  COURSE_LABEL: 'Ders',
  ASSISTANT_LABEL: 'Hedef Personel',
  SUMMARY_LABEL: 'Delegasyon Özeti',
  SUMMARY_TEXT:
    'Dersin asistanına yönlendirme normal delegasyon akışına girer. Diğer personeller için öğrencinin bir saat içinde onayı gerekir.',
  SELECT_ASSISTANT: 'Personel seçin',
  SINGLE_ASSISTANT_HINT: 'Derse atanmış tek asistan otomatik seçildi.',
  NO_ASSISTANTS: 'Bu tarih ve saatte uygun hedef personel bulunamadı.',
  ASSISTANTS_LOAD_ERROR: 'Uygun personel listesi yüklenemedi.',
  ASSISTANT_REQUIRED: 'Hedef personel seçimi zorunludur.',
  CONFIRM_LABEL: 'Onayla',
  SUCCESS: 'Delegasyon talebi başarıyla oluşturuldu.',
  ERROR: 'Delegasyon oluşturulamadı. Lütfen tekrar deneyin.',
  LOADING_ASSISTANTS: 'Uygun personeller yükleniyor...',
} as const;

export const INCOMING_DELEGATION_MESSAGES = {
  TITLE: 'Gelen Delegasyonlar',
  SUBTITLE: 'Size gönderilen bekleyen delegasyon taleplerini görüntüleyin.',
  LOADING: 'Gelen delegasyonlar yükleniyor...',
  LOAD_ERROR: 'Gelen delegasyonlar yüklenirken bir hata oluştu.',
  ACCESS_DENIED: 'Bu sayfayı görüntüleme yetkiniz bulunmuyor.',
  EMPTY_TITLE: 'Bekleyen delegasyon yok',
  EMPTY_DESCRIPTION: 'Şu anda size gönderilmiş bekleyen bir delegasyon talebi bulunmuyor.',
  ACCEPT_LABEL: 'Kabul Et',
  REJECT_LABEL: 'Reddet',
  ACCEPT_SUCCESS: 'Delegasyon kabul edildi. Randevu size aktarıldı.',
  REJECT_SUCCESS: 'Delegasyon reddedildi.',
  ACTION_ERROR: 'İşlem sırasında bir hata oluştu.',
  STATUS_PENDING: 'Bekliyor',
} as const;

export const DELEGATION_HISTORY_MESSAGES = {
  TITLE: 'Delegasyon Geçmişi',
  SUBTITLE: 'Geçmişte gerçekleşen delegasyon işlemlerini görüntüleyin.',
  LOADING: 'Delegasyon geçmişi yükleniyor...',
  LOAD_ERROR: 'Delegasyon geçmişi yüklenirken bir hata oluştu.',
  ACCESS_DENIED: 'Bu sayfayı görüntüleme yetkiniz bulunmuyor.',
  EMPTY_TITLE: 'Delegasyon geçmişi boş',
  EMPTY_DESCRIPTION: 'Henüz görüntülenecek bir delegasyon kaydı bulunmuyor.',
  EMPTY_FILTER: 'Filtrelere uygun delegasyon kaydı bulunamadı.',
  SEARCH_PLACEHOLDER: 'Akademisyen, asistan veya ders ara...',
  STATUS_FILTER_ALL: 'Tüm durumlar',
  DATE_FROM: 'Başlangıç tarihi',
  DATE_TO: 'Bitiş tarihi',
} as const;

export const DELEGATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  ACCEPTED: 'Kabul Edildi',
  REJECTED: 'Reddedildi',
  PENDING_STUDENT_APPROVAL: 'Öğrenci Onayı Bekliyor',
  STUDENT_REJECTED: 'Öğrenci Reddetti',
  EXPIRED: 'Süresi Doldu',
};

export function getDelegationStatusLabel(status: string): string {
  return DELEGATION_STATUS_LABELS[status] ?? status;
}

const NON_DELEGATABLE_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
  'APPROVED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
]);

export function canDelegateAppointment(
  appointment: StaffAppointment,
  scope: StaffAppointmentScope,
  user: AuthUser | null | undefined,
): boolean {
  if (scope !== 'academician') {
    return false;
  }
  if (!user || user.role !== 'ACADEMICIAN') {
    return false;
  }
  if (appointment.staffId !== user.userId) {
    return false;
  }
  if (appointment.courseId == null) {
    return false;
  }
  if (NON_DELEGATABLE_STATUSES.has(appointment.appointmentStatus)) {
    return false;
  }
  return true;
}

export function formatCourseLabel(appointment: StaffAppointment): string {
  if (!appointment.courseName) {
    return '-';
  }
  return `${appointment.courseCode ?? ''} ${appointment.courseName}`.trim();
}
