import { apiClient } from './apiClient';

export type NotificationItem = {
  notificationId: number;
  notificationType: string;
  title: string;
  message: string;
  relatedDelegationId: number | null;
  isRead: boolean;
  createdAt: string;
};

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const { data } = await apiClient.get<NotificationItem[]>('/notifications');
  return Array.isArray(data) ? data : [];
}
