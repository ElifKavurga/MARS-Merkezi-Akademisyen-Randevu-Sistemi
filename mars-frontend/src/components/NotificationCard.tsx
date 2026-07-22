import type { NotificationItem } from '../types/notification';
import { formatNotificationTime, getNotificationVisual } from '../utils/notification';

type NotificationCardProps = {
  notification: NotificationItem;
  compact?: boolean;
  onRead?: (notification: NotificationItem) => void;
};

export default function NotificationCard({ notification, compact = false, onRead }: NotificationCardProps) {
  const visual = getNotificationVisual(notification.notificationType);
  return (
    <button
      type="button"
      className={`group flex w-full items-start gap-3 border-0 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-fixed-dim ${compact ? 'px-4 py-3' : 'p-4 sm:gap-4 sm:p-5'} ${notification.isRead ? 'bg-surface-container-lowest' : 'bg-primary-fixed/35'}`}
      onClick={() => onRead?.(notification)}
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
        <span className={`mt-1 block text-on-surface-variant ${compact ? 'line-clamp-2 font-label-sm text-label-sm' : 'font-body-md text-sm sm:text-base'}`}>{notification.message}</span>
        <span className="mt-1.5 block font-label-sm text-label-sm text-outline">{formatNotificationTime(notification.createdAt)}</span>
      </span>
    </button>
  );
}
