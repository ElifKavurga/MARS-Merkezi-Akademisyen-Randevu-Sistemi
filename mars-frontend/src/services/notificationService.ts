import { apiClient } from './apiClient';
import type { NotificationItem, NotificationPage } from '../types/notification';

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const { data } = await apiClient.get<NotificationItem[]>('/notifications');
  return Array.isArray(data) ? data : [];
}

export async function getMyNotificationsPage(page: number, size: number): Promise<NotificationPage> {
  const { data } = await apiClient.get<NotificationPage>('/notifications/page', { params: { page, size } });
  return data;
}

export async function markNotificationAsRead(notificationId: number): Promise<NotificationItem> {
  const { data } = await apiClient.patch<NotificationItem>(`/notifications/${notificationId}/read`);
  window.dispatchEvent(new CustomEvent('mars:notification-read', { detail: notificationId }));
  return data;
}
