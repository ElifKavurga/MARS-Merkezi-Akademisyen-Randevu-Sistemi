import { useCallback, useEffect, useState } from 'react';
import Loading from '../components/Loading';
import NotificationCard from '../components/NotificationCard';
import { getMyNotificationsPage } from '../services/notificationService';
import type { NotificationItem, NotificationPage } from '../types/notification';
import { useNotifications } from '../hooks/useNotifications';

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const { latestNotification, markAsRead } = useNotifications();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<NotificationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await getMyNotificationsPage(page, PAGE_SIZE));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void loadPage(); }, [loadPage]);

  useEffect(() => {
    if (!latestNotification || page !== 0) return;
    setData((current) => {
      if (!current || current.content.some((item) => item.notificationId === latestNotification.notificationId)) return current;
      return {
        ...current,
        content: [latestNotification, ...current.content].slice(0, PAGE_SIZE),
        totalElements: current.totalElements + 1,
        totalPages: Math.ceil((current.totalElements + 1) / current.size),
      };
    });
  }, [latestNotification, page]);

  const handleRead = async (notification: NotificationItem) => {
    if (notification.isRead) return;
    setData((current) => current ? { ...current, content: current.content.map((item) => item.notificationId === notification.notificationId ? { ...item, isRead: true } : item) } : current);
    try {
      await markAsRead(notification);
    } catch {
      setData((current) => current ? { ...current, content: current.content.map((item) => item.notificationId === notification.notificationId ? { ...item, isRead: false } : item) } : current);
    }
  };

  return (
    <div className="admin-page mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-headline-lg text-2xl font-bold text-on-background sm:text-headline-lg">Bildirim Merkezi</h1>
        <p className="mt-2 font-body-md text-sm text-on-surface-variant sm:text-base">Size gönderilen güncel bildirimleri görüntüleyin.</p>
      </div>

      {loading ? <Loading variant="page" label="Bildirimler yükleniyor..." /> : null}

      {!loading && error ? (
        <div className="rounded-xl border border-error/30 bg-error-container/40 px-6 py-10 text-center">
          <span className="material-symbols-outlined text-[40px] text-error" aria-hidden="true">error</span>
          <p className="mt-3 font-body-md text-on-error-container">Bildirimler yüklenemedi.</p>
          <button type="button" onClick={() => void loadPage()} className="mt-4 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-md text-sm text-primary transition-colors hover:bg-surface-container-low">Tekrar Dene</button>
        </div>
      ) : null}

      {!loading && !error && data?.content.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/45" aria-hidden="true">notifications_none</span>
          <p className="mt-3 font-headline-md text-lg font-semibold text-on-background">Henüz bildiriminiz bulunmuyor.</p>
        </div>
      ) : null}

      {!loading && !error && data && data.content.length > 0 ? (
        <>
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm" aria-label="Bildirim listesi">
            <ul className="m-0 divide-y divide-outline-variant p-0">
              {data.content.map((notification) => <li key={notification.notificationId} className="list-none"><NotificationCard notification={notification} onRead={handleRead} /></li>)}
            </ul>
          </section>

          {data.totalPages > 1 ? (
            <nav className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Bildirim sayfaları">
              <p className="m-0 font-label-sm text-label-sm text-on-surface-variant">Sayfa {data.page + 1} / {data.totalPages} · Toplam {data.totalElements} bildirim</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={data.first} onClick={() => setPage((value) => Math.max(0, value - 1))} className="inline-flex h-10 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-label-md text-sm text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-45"><span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>Önceki</button>
                <button type="button" disabled={data.last} onClick={() => setPage((value) => value + 1)} className="inline-flex h-10 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-label-md text-sm text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-45">Sonraki<span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span></button>
              </div>
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
