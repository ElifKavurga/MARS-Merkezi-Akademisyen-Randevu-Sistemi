import { ROLES } from '../constants/roles';
import {
  ROUTES,
  academicianAppointmentDetailPath,
  studentAppointmentDetailPath,
  studentDelegationDetailPath,
} from '../constants/routes';
import type { NotificationItem } from '../types/notification';

export function getNotificationTarget(notification: NotificationItem, role?: string): string | null {
  const appointmentId = notification.relatedAppointmentId;
  const delegationType = notification.notificationType.startsWith('DELEGATION_')
    || notification.notificationType === 'STUDENT_APPROVAL_PENDING';

  if (delegationType) {
    if (role === ROLES.ASSISTANT) return ROUTES.ASSISTANT_INCOMING_DELEGATIONS;
    if (role === ROLES.ACADEMICIAN) return ROUTES.ACADEMICIAN_DELEGATION_HISTORY;
    if (role === ROLES.STUDENT && notification.relatedDelegationId) {
      return studentDelegationDetailPath(notification.relatedDelegationId);
    }
    return null;
  }

  if (!appointmentId) return null;
  if (role === ROLES.STUDENT) return studentAppointmentDetailPath(appointmentId);
  if (role === ROLES.ACADEMICIAN) return academicianAppointmentDetailPath(appointmentId);
  if (role === ROLES.ASSISTANT) return ROUTES.ASSISTANT_APPOINTMENTS;
  return null;
}
