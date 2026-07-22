import type { NotificationType } from '../types/notification';

type NotificationVisual = {
  icon: string;
  iconClass: string;
  containerClass: string;
};

const APPROVED_TYPES = new Set<NotificationType>([
  'APPOINTMENT_APPROVED', 'DELEGATION_ACCEPTED',
]);
const REJECTED_TYPES = new Set<NotificationType>([
  'APPOINTMENT_REJECTED', 'APPOINTMENT_CANCELLED',
  'DELEGATION_REJECTED', 'DELEGATION_EXPIRED',
]);

export function getNotificationVisual(type: NotificationType): NotificationVisual {
  if (APPROVED_TYPES.has(type)) {
    return { icon: 'check_circle', iconClass: 'text-emerald-700', containerClass: 'bg-emerald-50' };
  }
  if (REJECTED_TYPES.has(type)) {
    return { icon: 'cancel', iconClass: 'text-error', containerClass: 'bg-error-container/60' };
  }
  if (type === 'APPOINTMENT_RESCHEDULED') {
    return { icon: 'event_repeat', iconClass: 'text-primary-container', containerClass: 'bg-primary-fixed' };
  }
  if (type === 'STUDENT_APPROVAL_PENDING') {
    return { icon: 'hourglass_top', iconClass: 'text-primary-container', containerClass: 'bg-primary-fixed' };
  }
  if (type.startsWith('DELEGATION_')) {
    return { icon: 'forward_to_inbox', iconClass: 'text-secondary', containerClass: 'bg-secondary-container/70' };
  }
  return { icon: 'event_note', iconClass: 'text-primary-container', containerClass: 'bg-surface-container-high' };
}

export function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}
