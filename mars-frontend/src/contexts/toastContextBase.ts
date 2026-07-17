import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

export type ToastActions = {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  dismiss: (id: string) => void;
};

export type ToastContextValue = ToastActions & {
  toasts: ToastItem[];
};

export const ToastActionsContext = createContext<ToastActions | undefined>(undefined);
export const ToastStateContext = createContext<ToastItem[]>([]);
