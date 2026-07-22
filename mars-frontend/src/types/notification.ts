export type NotificationType =
  | 'NEW_APPOINTMENT_REQUEST'
  | 'APPOINTMENT_APPROVED'
  | 'APPOINTMENT_REJECTED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'DELEGATION_REQUEST'
  | 'DELEGATION_ACCEPTED'
  | 'DELEGATION_REJECTED'
  | 'STUDENT_APPROVAL_PENDING'
  | 'DELEGATION_EXPIRED';

export type NotificationItem = {
  notificationId: number;
  userId: number;
  notificationType: NotificationType;
  title: string;
  message: string;
  relatedAppointmentId: number | null;
  relatedDelegationId: number | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationPage = {
  content: NotificationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};
