import { useContext } from 'react';
import { ToastContext } from '../contexts/toastContextBase';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export type { ToastType, ToastItem } from '../contexts/toastContextBase';
