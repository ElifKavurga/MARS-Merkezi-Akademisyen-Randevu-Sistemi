import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  ToastActionsContext,
  ToastStateContext,
  type ToastItem,
  type ToastType,
} from './toastContextBase';

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

  const success = useCallback(
    (message: string) => showToast('success', message),
    [showToast],
  );
  const error = useCallback(
    (message: string) => showToast('error', message),
    [showToast],
  );
  const info = useCallback(
    (message: string) => showToast('info', message),
    [showToast],
  );
  const warning = useCallback(
    (message: string) => showToast('warning', message),
    [showToast],
  );

  const actions = useMemo(
    () => ({
      showToast,
      success,
      error,
      info,
      warning,
      dismiss,
    }),
    [showToast, success, error, info, warning, dismiss],
  );

  return (
    <ToastActionsContext.Provider value={actions}>
      <ToastStateContext.Provider value={toasts}>{children}</ToastStateContext.Provider>
    </ToastActionsContext.Provider>
  );
}
