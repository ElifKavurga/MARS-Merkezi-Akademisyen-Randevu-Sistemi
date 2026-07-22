import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { getMyNotifications, markNotificationAsRead } from '../services/notificationService';
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
  const [loading, setLoading] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const receivedIdsRef = useRef(new Set<number>());

  const dismissToast = useCallback((toastKey: string) => {
    setToasts((current) => current.filter((toast) => toast.toastKey !== toastKey));
  }, []);

  useEffect(() => {
    if (!token || !user) {
      setRecentNotifications([]);
      setLatestNotification(null);
      setToasts([]);
      receivedIdsRef.current.clear();
      return;
    }
    let cancelled = false;
    receivedIdsRef.current.clear();
    setLoading(true);
    void getMyNotifications()
      .then((notifications) => {
        if (cancelled) return;
        notifications.forEach((item) => receivedIdsRef.current.add(item.notificationId));
        setRecentNotifications((current) => mergeNotificationHistory(current, notifications));
      })
      .catch(() => undefined)
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
    if (notification.isRead) return;
    setRecentNotifications((current) => current.map((item) => item.notificationId === notification.notificationId ? { ...item, isRead: true } : item));
    try {
      await markNotificationAsRead(notification.notificationId);
    } catch (error) {
      setRecentNotifications((current) => current.map((item) => item.notificationId === notification.notificationId ? { ...item, isRead: false } : item));
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    recentNotifications,
    unreadCount: recentNotifications.filter((item) => !item.isRead).length,
    loading,
    latestNotification,
    markAsRead,
  }), [latestNotification, loading, markAsRead, recentNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[110] flex w-[min(100%-2rem,23rem)] flex-col gap-2" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const visual = getNotificationVisual(toast.notificationType);
          return (
            <div key={toast.toastKey} role="status" className="flex animate-fade-in items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-xl">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${visual.containerClass}`}><span className={`material-symbols-outlined text-[22px] ${visual.iconClass}`} aria-hidden="true">{visual.icon}</span></span>
              <span className="min-w-0 flex-1"><strong className="block font-label-md text-sm text-on-surface">{toast.title}</strong><span className="mt-1 line-clamp-2 block font-body-md text-sm text-on-surface-variant">{toast.message}</span></span>
              <button type="button" onClick={() => dismissToast(toast.toastKey)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-on-surface-variant transition-colors hover:bg-surface-container" aria-label="Bildirimi kapat"><span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span></button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}
