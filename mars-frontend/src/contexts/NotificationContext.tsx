import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../hooks/useAuth';
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationService';
import type { NotificationItem } from '../types/notification';
import { getNotificationVisual } from '../utils/notification';
import { NotificationContext } from './notificationContextBase';

const RECENT_LIMIT = 20;
const TOAST_DURATION_MS = 5000;

type RealtimeToast = NotificationItem & { toastKey: string };

function socketUrl(): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return new URL(`${base}/ws/notifications`, window.location.origin).toString();
}

function mergeNotification(current: NotificationItem[], incoming: NotificationItem): NotificationItem[] {
  const withoutDuplicate = current.filter((item) => item.notificationId !== incoming.notificationId);
  return [incoming, ...withoutDuplicate]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, RECENT_LIMIT);
}

function mergeNotificationHistory(
  current: NotificationItem[],
  history: NotificationItem[],
): NotificationItem[] {
  return history.reduce(mergeNotification, current);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);
  const [toasts, setToasts] = useState<RealtimeToast[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const receivedIdsRef = useRef(new Set<number>());
  const readRequestsRef = useRef(new Set<number>());

  const dismissToast = useCallback((toastKey: string) => {
    setToasts((current) => current.filter((toast) => toast.toastKey !== toastKey));
  }, []);

  useEffect(() => {
    if (!token || !user) {
      setRecentNotifications([]);
      setLatestNotification(null);
      setToasts([]);
      setUnreadCount(0);
      receivedIdsRef.current.clear();
      readRequestsRef.current.clear();
      return;
    }
    let cancelled = false;
    receivedIdsRef.current.clear();
    setLoading(true);
    const historyRequest = getMyNotifications().then((notifications) => {
        if (cancelled) return;
        notifications.forEach((item) => receivedIdsRef.current.add(item.notificationId));
        setRecentNotifications((current) => mergeNotificationHistory(current, notifications));
      });
    const countRequest = getMyUnreadNotificationCount().then((count) => {
      if (!cancelled) setUnreadCount(count);
    });
    void Promise.allSettled([historyRequest, countRequest])
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) return;

    const client = new Client({
      connectHeaders: { Authorization: `Bearer ${token}` },
      webSocketFactory: () => new SockJS(socketUrl()),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => undefined,
    });
    client.onConnect = () => {
      client.subscribe('/user/queue/notifications', (message: IMessage) => {
        const incoming = JSON.parse(message.body) as NotificationItem;
        if (receivedIdsRef.current.has(incoming.notificationId)) return;
        receivedIdsRef.current.add(incoming.notificationId);
        setRecentNotifications((current) => mergeNotification(current, incoming));
        if (!incoming.isRead) setUnreadCount((current) => current + 1);
        setLatestNotification(incoming);
        const toastKey = `notification-${incoming.notificationId}`;
        setToasts((current) => [...current, { ...incoming, toastKey }]);
        window.setTimeout(() => dismissToast(toastKey), TOAST_DURATION_MS);
      });
    };
    clientRef.current = client;
    const activationTimer = window.setTimeout(() => client.activate(), 0);

    return () => {
      window.clearTimeout(activationTimer);
      clientRef.current = null;
      void client.deactivate();
    };
  }, [dismissToast, token, user]);

  const markAsRead = useCallback(async (notification: NotificationItem) => {
    if (notification.isRead || readRequestsRef.current.has(notification.notificationId)) return;
    readRequestsRef.current.add(notification.notificationId);
    setRecentNotifications((current) => current.map((item) => item.notificationId === notification.notificationId ? { ...item, isRead: true } : item));
    setUnreadCount((current) => Math.max(0, current - 1));
    try {
      await markNotificationAsRead(notification.notificationId);
    } catch (error) {
      setRecentNotifications((current) => current.map((item) => item.notificationId === notification.notificationId ? { ...item, isRead: false } : item));
      setUnreadCount((current) => current + 1);
      throw error;
    } finally {
      readRequestsRef.current.delete(notification.notificationId);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = new Set(recentNotifications.filter((item) => !item.isRead).map((item) => item.notificationId));
    setRecentNotifications((current) => current.map((item) => item.isRead ? item : { ...item, isRead: true }));
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      setRecentNotifications((current) => current.map((item) => unreadIds.has(item.notificationId) ? { ...item, isRead: false } : item));
      void getMyUnreadNotificationCount().then(setUnreadCount).catch(() => undefined);
      throw error;
    }
  }, [recentNotifications]);

  const value = useMemo(() => ({
    recentNotifications,
    unreadCount,
    loading,
    latestNotification,
    markAsRead,
    markAllAsRead,
  }), [latestNotification, loading, markAllAsRead, markAsRead, recentNotifications, unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        className="fixed right-3 flex w-[min(100%-1.5rem,22rem)] flex-col gap-2 overflow-y-auto p-1 font-body-md sm:right-4"
        style={{ top: '6rem', zIndex: 2147483647, maxHeight: 'calc(100dvh - 7rem)' }}
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => {
          const visual = getNotificationVisual(toast.notificationType);
          return (
            <div key={toast.toastKey} role="status" className="flex animate-fade-in items-start gap-3 rounded-lg border border-l-4 border-outline-variant border-l-primary-container bg-surface-container-lowest p-3 shadow-lg">
              <span className={`material-symbols-outlined shrink-0 text-[22px] ${visual.iconClass}`} aria-hidden="true">{visual.icon}</span>
              <span className="min-w-0 flex-1 pt-0.5 font-body-md text-body-md">
                <strong className="block font-body-md text-body-md font-semibold text-on-surface">{toast.title}</strong>
                <span className="mt-0.5 line-clamp-2 block font-body-md text-body-md font-normal text-on-surface-variant">{toast.message}</span>
              </span>
              <button type="button" onClick={() => dismissToast(toast.toastKey)} className="inline-flex h-7 w-7 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-md border-0 bg-transparent p-0 text-on-surface-variant/70 transition-colors hover:bg-surface-container hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/20" aria-label="Bildirimi kapat"><span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">close</span></button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}
