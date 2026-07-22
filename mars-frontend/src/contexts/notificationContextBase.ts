import { createContext } from 'react';
import type { NotificationItem } from '../types/notification';

export type NotificationContextValue = {
  recentNotifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  latestNotification: NotificationItem | null;
  markAsRead: (notification: NotificationItem) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

export const NotificationContext = createContext<NotificationContextValue | null>(null);
