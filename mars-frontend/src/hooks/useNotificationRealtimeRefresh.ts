import { useEffect, useRef } from 'react';
import { useNotifications } from './useNotifications';
import type { NotificationItem } from '../types/notification';

const REFRESH_DEBOUNCE_MS = 100;

export function useNotificationRealtimeRefresh(
  isRelevant: (notification: NotificationItem) => boolean,
  refresh: () => void | Promise<unknown>,
) {
  const { realtimeNotifications } = useNotifications();
  const handledIdsRef = useRef(new Set<number>());
  const refreshRef = useRef(refresh);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let shouldRefresh = false;
    for (const notification of realtimeNotifications) {
      if (handledIdsRef.current.has(notification.notificationId)) continue;
      handledIdsRef.current.add(notification.notificationId);
      if (isRelevant(notification)) shouldRefresh = true;
    }
    if (!shouldRefresh) return;

    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void refreshRef.current();
    }, REFRESH_DEBOUNCE_MS);
  }, [isRelevant, realtimeNotifications]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);
}
