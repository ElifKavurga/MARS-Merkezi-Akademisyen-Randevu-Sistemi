import { ROLES } from '../constants/roles';
import {
  academicianAppointmentDetailPath,
  academicianIncomingDelegationDetailPath,
  assistantAppointmentDetailPath,
  assistantDelegationDetailPath,
  studentAppointmentDetailPath,

} from '../constants/routes';
import type { NotificationItem } from '../types/notification';

export function getNotificationTarget(notification: NotificationItem, role?: string): string | null {
  const appointmentId = notification.relatedAppointmentId;
  const academicianLikeRole = role === ROLES.ACADEMICIAN || role === ROLES.HOD;
  const delegationType = notification.notificationType.startsWith('DELEGATION_')
    || notification.notificationType === 'STUDENT_APPROVAL_PENDING';

  if (delegationType) {
    if (role === ROLES.ASSISTANT && notification.relatedDelegationId) {
      return assistantDelegationDetailPath(notification.relatedDelegationId);
    }
    if (academicianLikeRole && notification.relatedDelegationId) {
      return academicianIncomingDelegationDetailPath(notification.relatedDelegationId);
    }
    if (role === ROLES.STUDENT && appointmentId) {
      return studentAppointmentDetailPath(appointmentId);
    }
    return null;
  }

  if (!appointmentId) return null;
  if (role === ROLES.STUDENT) return studentAppointmentDetailPath(appointmentId);
  if (academicianLikeRole) return academicianAppointmentDetailPath(appointmentId);
  if (role === ROLES.ASSISTANT) return assistantAppointmentDetailPath(appointmentId);
  return null;
}
