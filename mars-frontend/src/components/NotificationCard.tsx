import type { NotificationItem } from '../types/notification';
import { formatNotificationTime, getNotificationVisual } from '../utils/notification';
import { acceptWaitlistOffer, rejectWaitlistOffer } from '../services/waitlistService';
import { acceptStudentDelegation, rejectStudentDelegation } from '../services/delegationService';
import { useState } from 'react';

type NotificationCardProps = {
  notification: NotificationItem;
  compact?: boolean;
  onRead?: (notification: NotificationItem) => void;
  onOpen?: (notification: NotificationItem) => void;
  onActionComplete?: () => void;
};

export default function NotificationCard({ notification, compact = false, onRead, onOpen, onActionComplete }: NotificationCardProps) {
  const visual = getNotificationVisual(notification.notificationType);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<'accepted' | 'rejected' | null>(null);

  const getWaitlistEntryId = () => {
    if (!notification.eventKey) return null;
    const parts = notification.eventKey.split(':');
    if (parts[0] === 'WAITLIST' && parts[1]) {
      const id = parseInt(parts[1], 10);
      return isNaN(id) ? null : id;
    }
    return null;
  };

  const waitlistEntryId = getWaitlistEntryId();

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!waitlistEntryId || actionLoading) return;
    setActionLoading(true);
    try {
      await acceptWaitlistOffer(waitlistEntryId);
      setActionResult('accepted');
      onRead?.(notification);
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Teklif kabul edilirken bir hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!waitlistEntryId || actionLoading) return;
    setActionLoading(true);
    try {
      await rejectWaitlistOffer(waitlistEntryId);
      setActionResult('rejected');
      onRead?.(notification);
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Teklif reddedilirken bir hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelegationAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.relatedDelegationId || actionLoading) return;
    setActionLoading(true);
    try {
      await acceptStudentDelegation(notification.relatedDelegationId);
      setActionResult('accepted');
      onRead?.(notification);
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Randevu devri kabul edilirken bir hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelegationReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.relatedDelegationId || actionLoading) return;
    setActionLoading(true);
    try {
      await rejectStudentDelegation(notification.relatedDelegationId);
      setActionResult('rejected');
      onRead?.(notification);
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Randevu devri reddedilirken bir hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`group flex w-full items-start gap-3 border-0 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-fixed-dim ${compact ? 'px-4 py-3' : 'p-4 sm:gap-4 sm:p-5'} ${notification.isRead ? 'bg-surface-container-lowest' : 'bg-primary-fixed/35'}`}
      onClick={() => {
        onRead?.(notification);
        onOpen?.(notification);
      }}
      aria-label={`${notification.title}, ${notification.isRead ? 'okundu' : 'okunmadı'}`}
    >
      <span className={`flex shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${visual.containerClass} ${compact ? 'h-9 w-9' : 'h-11 w-11 sm:h-12 sm:w-12'}`}>
        <span className={`material-symbols-outlined ${visual.iconClass} ${compact ? 'text-[20px]' : 'text-[24px]'}`} aria-hidden="true">{visual.icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className={`min-w-0 flex-1 font-label-md text-label-md text-on-surface ${notification.isRead ? 'font-medium' : 'font-bold'}`}>{notification.title}</span>
          {!notification.isRead ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-container" title="Okunmadı" /> : null}
        </span>
        <span className={`mt-1 block break-words text-on-surface-variant ${compact ? 'line-clamp-2 font-label-sm text-label-sm' : 'font-body-md text-sm sm:text-base'}`}>{notification.message}</span>
        
        {notification.notificationType === 'WAITLIST_TURN_AVAILABLE' && waitlistEntryId && !notification.isRead && !actionResult && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleAccept}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 font-label-sm text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              Kabul Et
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleReject}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-label-sm text-xs font-semibold text-error transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              Reddet
            </button>
          </div>
        )}

        {notification.notificationType === 'STUDENT_APPROVAL_PENDING' && notification.relatedDelegationId && !notification.isRead && !actionResult && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDelegationAccept}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 font-label-sm text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              Kabul Et
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDelegationReject}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-label-sm text-xs font-semibold text-error transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              Reddet
            </button>
          </div>
        )}

        {actionResult === 'accepted' && (
          <span className="mt-2 block font-label-sm text-xs font-semibold text-emerald-600">
            {notification.notificationType === 'STUDENT_APPROVAL_PENDING' ? 'Randevu devri kabul edildi.' : 'Teklif kabul edildi, randevunuz oluşturuldu.'}
          </span>
        )}
        {actionResult === 'rejected' && (
          <span className="mt-2 block font-label-sm text-xs font-semibold text-error">
            {notification.notificationType === 'STUDENT_APPROVAL_PENDING' ? 'Randevu devri reddedildi. Randevunuz mevcut personelde kaldı.' : 'Teklif reddedildi.'}
          </span>
        )}

        <span className="mt-1.5 block font-label-sm text-label-sm text-outline">{formatNotificationTime(notification.createdAt)}</span>
      </span>
    </button>
  );
}
