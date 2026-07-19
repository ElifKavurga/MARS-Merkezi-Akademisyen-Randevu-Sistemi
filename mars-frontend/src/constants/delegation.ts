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
    'Bu randevu talebini ilgili dersin atanmış asistanına devredebilirsiniz.',
  COURSE_LABEL: 'Ders',
  ASSISTANT_LABEL: 'Asistan',
  SUMMARY_LABEL: 'Delegasyon Özeti',
  SUMMARY_TEXT:
    'Onayladığınızda asistanın kabulünü bekleyen bir delegasyon kaydı oluşturulur. Randevu sahibi henüz değişmez.',
  SELECT_ASSISTANT: 'Asistan seçin',
  SINGLE_ASSISTANT_HINT: 'Derse atanmış tek asistan otomatik seçildi.',
  NO_ASSISTANTS: 'Bu derse atanmış aktif asistan bulunamadı.',
  ASSISTANTS_LOAD_ERROR: 'Asistan listesi yüklenemedi.',
  ASSISTANT_REQUIRED: 'Asistan seçimi zorunludur.',
  CONFIRM_LABEL: 'Onayla',
  SUCCESS: 'Delegasyon talebi başarıyla oluşturuldu.',
  ERROR: 'Delegasyon oluşturulamadı. Lütfen tekrar deneyin.',
  LOADING_ASSISTANTS: 'Asistanlar yükleniyor...',
} as const;

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
