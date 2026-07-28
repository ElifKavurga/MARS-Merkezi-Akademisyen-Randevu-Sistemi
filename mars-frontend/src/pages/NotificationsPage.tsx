import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import NotificationCard from '../components/NotificationCard';
import StudentSegmentedTabs from '../components/StudentSegmentedTabs';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { getMyNotifications } from '../services/notificationService';
import type { NotificationItem, NotificationType } from '../types/notification';
import { getNotificationTarget } from '../utils/notificationNavigation';

const PAGE_SIZE = 10;

type NotificationCategoryFilter = 'ALL' | 'APPOINTMENTS' | 'DELEGATION' | 'WAITLIST' | 'SYSTEM';
type NotificationReadFilter = 'ALL' | 'READ' | 'UNREAD';

const categoryOptions: readonly { value: NotificationCategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'Tümü' },
  { value: 'APPOINTMENTS', label: 'Randevular' },
  { value: 'DELEGATION', label: 'Delegasyon' },
  { value: 'WAITLIST', label: 'Bekleme Listesi' },
  { value: 'SYSTEM', label: 'Sistem Bildirimleri' },
];

const readOptions: readonly { value: NotificationReadFilter; label: string }[] = [
  { value: 'ALL', label: 'Tümü' },
  { value: 'READ', label: 'Okundu' },
  { value: 'UNREAD', label: 'Okunmadı' },
];

const appointmentTypes = new Set<NotificationType>([
  'NEW_APPOINTMENT_REQUEST',
  'APPOINTMENT_APPROVED',
  'APPOINTMENT_REJECTED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_RESCHEDULE_REQUESTED',
  'APPOINTMENT_RESCHEDULE_REJECTED',
  'APPOINTMENT_RESCHEDULE_EXPIRED',
  'NO_SHOW_RECORDED',
]);

const delegationTypes = new Set<NotificationType>([
  'DELEGATION_REQUEST',
  'DELEGATION_ACCEPTED',
  'DELEGATION_REJECTED',
  'STUDENT_APPROVAL_PENDING',
  'DELEGATION_EXPIRED',
]);

const waitlistTypes = new Set<NotificationType>([
  'WAITLIST_ADDED',
  'WAITLIST_TURN_AVAILABLE',
  'WAITLIST_REMOVED',
  'WAITLIST_CANCELLED',
]);

function matchesCategory(notification: NotificationItem, filter: NotificationCategoryFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'APPOINTMENTS') return appointmentTypes.has(notification.notificationType);
  if (filter === 'DELEGATION') return delegationTypes.has(notification.notificationType);
  if (filter === 'WAITLIST') return waitlistTypes.has(notification.notificationType);
  return notification.notificationType === 'SYSTEM'
    || notification.notificationType === 'PENALTY_APPLIED'
    || notification.notificationType === 'PENALTY_LIFTED';
}

function matchesReadState(notification: NotificationItem, filter: NotificationReadFilter): boolean {
  if (filter === 'ALL') return true;
  return filter === 'READ' ? notification.isRead : !notification.isRead;
}

function sortNotifications(notifications: NotificationItem[]): NotificationItem[] {
  return [...notifications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { realtimeNotifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategoryFilter>('ALL');
  const [readFilter, setReadFilter] = useState<NotificationReadFilter>('ALL');
  const [page, setPage] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setNotifications(sortNotifications(await getMyNotifications()));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (realtimeNotifications.length === 0) return;
    setNotifications((current) => {
      const currentById = new Map(current.map((item) => [item.notificationId, item]));
      realtimeNotifications.forEach((item) => currentById.set(item.notificationId, item));
      return sortNotifications([...currentById.values()]);
    });
  }, [realtimeNotifications]);

  useEffect(() => {
    setPage(0);
  }, [categoryFilter, readFilter]);

  const filteredNotifications = useMemo(
    () => notifications.filter((item) =>
      matchesCategory(item, categoryFilter) && matchesReadState(item, readFilter)),
    [categoryFilter, notifications, readFilter],
  );

  const totalElements = filteredNotifications.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / PAGE_SIZE);
  const safePage = totalPages === 0 ? 0 : Math.min(page, totalPages - 1);
  const pageItems = filteredNotifications.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const hasAnyNotification = notifications.length > 0;

  const handleRead = async (notification: NotificationItem) => {
    if (notification.isRead) return;
    setNotifications((current) => current.map((item) =>
      item.notificationId === notification.notificationId ? { ...item, isRead: true } : item));
    try {
      await markAsRead(notification);
    } catch {
      setNotifications((current) => current.map((item) =>
        item.notificationId === notification.notificationId ? { ...item, isRead: false } : item));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0 || unreadCount === 0 || markingAll) return;
    const unreadIds = new Set(notifications.filter((item) => !item.isRead).map((item) => item.notificationId));
    setMarkingAll(true);
    setNotifications((current) => current.map((item) => item.isRead ? item : { ...item, isRead: true }));
    try {
      await markAllAsRead();
    } catch {
      setNotifications((current) => current.map((item) =>
        unreadIds.has(item.notificationId) ? { ...item, isRead: false } : item));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="admin-page mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-on-background sm:text-headline-lg">Bildirim Merkezi</h1>
        </div>
        <button type="button" disabled={unreadCount === 0 || markingAll} onClick={() => void handleMarkAllAsRead()} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-sm font-semibold text-primary-container transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">done_all</span>
          {markingAll ? 'İşaretleniyor...' : 'Tümünü Okundu İşaretle'}
        </button>
      </div>

      {loading ? <Loading variant="page" label="Bildirimler yükleniyor..." /> : null}

      {!loading && error ? (
        <div className="rounded-xl border border-error/30 bg-error-container/40 px-6 py-10 text-center">
          <span className="material-symbols-outlined text-[40px] text-error" aria-hidden="true">error</span>
          <p className="mt-3 font-body-md text-on-error-container">Bildirimler yüklenemedi.</p>
          <button type="button" onClick={() => void loadNotifications()} className="mt-4 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-md text-sm text-primary transition-colors hover:bg-surface-container-low">Tekrar Dene</button>
        </div>
      ) : null}

      {!loading && !error && hasAnyNotification ? (
        <section className="mb-4 space-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm sm:p-4" aria-label="Bildirim filtreleri">
          <StudentSegmentedTabs
            value={categoryFilter}
            options={categoryOptions}
            ariaLabel="Bildirim türü filtresi"
            onChange={setCategoryFilter}
          />
          <StudentSegmentedTabs
            value={readFilter}
            options={readOptions}
            ariaLabel="Bildirim okundu durumu filtresi"
            onChange={setReadFilter}
          />
        </section>
      ) : null}

      {!loading && !error && !hasAnyNotification ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/45" aria-hidden="true">notifications_none</span>
          <p className="mt-3 font-headline-md text-lg font-semibold text-on-background">Henüz bildiriminiz bulunmuyor.</p>
        </div>
      ) : null}

      {!loading && !error && hasAnyNotification && pageItems.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/45" aria-hidden="true">filter_alt_off</span>
          <p className="mt-3 font-headline-md text-lg font-semibold text-on-background">Bu filtreye uygun bildirim bulunmuyor.</p>
        </div>
      ) : null}

      {!loading && !error && pageItems.length > 0 ? (
        <>
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm" aria-label="Bildirim listesi">
            <ul className="m-0 divide-y divide-outline-variant p-0">
              {pageItems.map((notification) => (
                <li key={notification.notificationId} className="list-none">
                  <NotificationCard
                    notification={notification}
                    onRead={handleRead}
                    onOpen={(item) => {
                      const target = getNotificationTarget(item, user?.role);
                      if (target) navigate(target);
                    }}
                    onActionComplete={() => void loadNotifications()}
                  />
                </li>
              ))}
            </ul>
          </section>

          {totalPages > 1 ? (
            <nav className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Bildirim sayfaları">
              <p className="m-0 font-label-sm text-label-sm text-on-surface-variant">Sayfa {safePage + 1} / {totalPages} · Toplam {totalElements} bildirim</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="inline-flex h-10 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-label-md text-sm text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-45"><span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>Önceki</button>
                <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage((value) => value + 1)} className="inline-flex h-10 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-label-md text-sm text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-45">Sonraki<span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span></button>
              </div>
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
