import { apiClient } from './apiClient';
import type { NotificationItem, NotificationPage } from '../types/notification';

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const { data } = await apiClient.get<NotificationItem[]>('/notifications');
  return Array.isArray(data) ? data : [];
}

function buildFallbackPage(
  notifications: NotificationItem[],
  page: number,
  size: number,
): NotificationPage {
  const safePage = Math.max(0, page);
  const safeSize = Math.max(1, size);
  const totalElements = notifications.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / safeSize);
  const start = safePage * safeSize;
  const content = notifications.slice(start, start + safeSize);
  return {
    content,
    page: safePage,
    size: safeSize,
    totalElements,
    totalPages,
    first: safePage === 0,
    last: totalPages === 0 ? true : safePage >= totalPages - 1,
  };
}

export async function getMyNotificationsPage(page: number, size: number): Promise<NotificationPage> {
  try {
    const { data } = await apiClient.get<NotificationPage>('/notifications/page', { params: { page, size } });
    return data;
  } catch {
    const notifications = await getMyNotifications();
    return buildFallbackPage(notifications, page, size);
  }
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
