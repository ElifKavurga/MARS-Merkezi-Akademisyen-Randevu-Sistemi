import { useContext } from 'react';
import { NotificationContext } from '../contexts/notificationContextBase';

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications, NotificationProvider içinde kullanılmalıdır.');
  return context;
}
