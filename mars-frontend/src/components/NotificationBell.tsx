import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCard from './NotificationCard';
import { useAuth } from '../hooks/useAuth';
import { getNotificationTarget } from '../utils/notificationNavigation';

const PREVIEW_LIMIT = 5;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentNotifications, unreadCount, loading, markAsRead } = useNotifications();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const visibleItems = recentNotifications.slice(0, PREVIEW_LIMIT);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
        aria-label={unreadCount ? `Bildirimler, ${unreadCount} okunmamış` : 'Bildirimler'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">notifications</span>
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-error px-1 font-label-sm text-[10px] leading-4 text-on-error">{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div id={panelId} role="dialog" aria-label="Bildirimler" className="fixed inset-x-4 top-[4.5rem] z-50 flex max-h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[23rem]">
          <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <p className="font-headline-md text-lg font-semibold text-primary">Bildirimler</p>
            {unreadCount > 0 ? <span className="rounded-full bg-primary-fixed px-2 py-1 font-label-sm text-[11px] text-on-primary-fixed">{unreadCount} yeni</span> : null}
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center font-body-md text-sm text-on-surface-variant" role="status">Bildirimler yükleniyor...</div>
          ) : visibleItems.length === 0 ? (
            <div className="px-4 py-9 text-center">
              <span className="material-symbols-outlined text-[34px] text-on-surface-variant/50" aria-hidden="true">notifications_none</span>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant">Henüz bildiriminiz bulunmuyor.</p>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-outline-variant/70 overflow-y-auto sm:max-h-[min(65vh,25rem)]">
              {visibleItems.map((item) => <li key={item.notificationId}><NotificationCard notification={item} compact onRead={(notification) => void markAsRead(notification).catch(() => undefined)} onOpen={(notification) => { const target = getNotificationTarget(notification, user?.role); if (target) { setOpen(false); navigate(target); } }} /></li>)}
            </ul>
          )}
          <Link to={ROUTES.NOTIFICATIONS} onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 border-t border-outline-variant px-4 py-3 font-label-md text-label-md font-semibold text-primary-container no-underline transition-colors hover:bg-surface-container-low">
            Tüm Bildirimleri Gör
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
