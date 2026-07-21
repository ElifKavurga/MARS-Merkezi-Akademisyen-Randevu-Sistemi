import { useEffect, useId, useRef, useState } from 'react';
import { getMyNotifications } from '../services/notificationService';

export type NotificationPreviewItem = {
  id: string;
  title: string;
  description?: string;
  createdAtLabel?: string;
};

type NotificationBellProps = {
  items?: readonly NotificationPreviewItem[];
  unreadCount?: number;
};

export default function NotificationBell({
  items,
  unreadCount,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [fetchedItems, setFetchedItems] = useState<NotificationPreviewItem[]>([]);
  const visibleItems = items ?? fetchedItems;
  const badgeCount = unreadCount ?? visibleItems.length;

  useEffect(() => {
    if (items) return;
    let cancelled = false;
    void getMyNotifications()
      .then((notifications) => {
        if (cancelled) return;
        setFetchedItems(notifications.map((notification) => ({
          id: String(notification.notificationId),
          title: notification.title,
          description: notification.message,
          createdAtLabel: new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          }).format(new Date(notification.createdAt)),
        })));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [items]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
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
        aria-label="Bildirimler"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
          notifications
        </span>
        {badgeCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-error px-1 font-label-sm text-[10px] leading-4 text-on-error">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Bildirimler"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg"
        >
          <div className="border-b border-outline-variant px-4 py-3">
            <p className="font-label-md text-label-md font-semibold text-primary">Bildirimler</p>
          </div>
          {visibleItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <span
                className="material-symbols-outlined text-[28px] text-on-surface-variant/50"
                aria-hidden="true"
              >
                notifications_none
              </span>
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                Yeni bildiriminiz bulunmuyor.
              </p>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {visibleItems.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-outline-variant/50 px-4 py-3 last:border-b-0"
                >
                  <p className="font-label-md text-label-md font-semibold text-on-background">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                      {item.description}
                    </p>
                  ) : null}
                  {item.createdAtLabel ? (
                    <p className="mt-1 font-label-sm text-label-sm text-outline">
                      {item.createdAtLabel}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
