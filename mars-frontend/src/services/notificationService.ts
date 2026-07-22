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
  return data;
}

export async function getMyUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
  return data.unreadCount;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}
