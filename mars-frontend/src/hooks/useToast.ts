import { useContext } from 'react';
import { ToastActionsContext, ToastStateContext } from '../contexts/toastContextBase';

export function useToast() {
  const context = useContext(ToastActionsContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function useToastState() {
  return useContext(ToastStateContext);
}

export type { ToastType, ToastItem } from '../contexts/toastContextBase';
