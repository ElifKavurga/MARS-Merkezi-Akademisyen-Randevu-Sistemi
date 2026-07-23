import type { AuthUser } from '../types/auth';
import type { StaffAppointment, StaffAppointmentScope } from '../types/appointment';

function hasScopeRole(
  scope: StaffAppointmentScope,
  user: AuthUser | null | undefined,
): boolean {
  return Boolean(user && user.role === scope.toUpperCase());
}

export function isOwnedStaffAppointment(
  appointment: StaffAppointment,
  scope: StaffAppointmentScope,
  user: AuthUser | null | undefined,
): boolean {
  return hasScopeRole(scope, user) && appointment.staffId === user?.userId;
}

export function canDecideStaffAppointment(
  appointment: StaffAppointment,
  scope: StaffAppointmentScope,
  user: AuthUser | null | undefined,
): boolean {
  return isOwnedStaffAppointment(appointment, scope, user)
    && appointment.appointmentStatus === 'PENDING';
}

export function canRescheduleAcademicianAppointment(
  appointment: StaffAppointment,
  user: AuthUser | null | undefined,
): boolean {
  return isOwnedStaffAppointment(appointment, 'academician', user)
    && !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.appointmentStatus);
}

export function canDelegateAcademicianAppointment(
  appointment: StaffAppointment,
  scope: StaffAppointmentScope,
  user: AuthUser | null | undefined,
): boolean {
  return getDelegationUnavailableReason(appointment, scope, user) === null;
}

export function getDelegationUnavailableReason(
  appointment: StaffAppointment,
  scope: StaffAppointmentScope,
  user: AuthUser | null | undefined,
  hasActiveDelegation = false,
): string | null {
  if (scope !== 'academician' || !isOwnedStaffAppointment(appointment, scope, user)) {
    return 'Yalnızca randevunun ilgili akademisyeni bu işlemi yapabilir.';
  }
  if (appointment.appointmentStatus === 'COMPLETED') {
    return 'Tamamlanmış randevular devredilemez.';
  }
  if (appointment.appointmentStatus === 'CANCELLED') {
    return 'İptal edilmiş randevular devredilemez.';
  }
  if (hasActiveDelegation) {
    return 'Bu randevu için devir süreci zaten başlatılmış.';
  }
  if (!['PENDING', 'APPROVED'].includes(appointment.appointmentStatus)) {
    return 'Bu randevu mevcut durumunda devredilemez.';
  }
  return null;
}
