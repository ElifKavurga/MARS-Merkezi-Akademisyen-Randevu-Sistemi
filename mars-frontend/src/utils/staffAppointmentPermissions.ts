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
  return isOwnedStaffAppointment(appointment, scope, user)
    && scope === 'academician'
    && appointment.appointmentStatus === 'PENDING'
    && appointment.courseId != null;
}
