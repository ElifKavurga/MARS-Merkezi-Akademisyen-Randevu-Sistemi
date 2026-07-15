import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ToastContext, type ToastItem, type ToastType } from './toastContextBase';

const TOAST_DURATION_MS = 4000;

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${toastIdCounter++}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      success: (message: string) => showToast('success', message),
      error: (message: string) => showToast('error', message),
      info: (message: string) => showToast('info', message),
      warning: (message: string) => showToast('warning', message),
      dismiss,
    }),
    [toasts, showToast, dismiss],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
