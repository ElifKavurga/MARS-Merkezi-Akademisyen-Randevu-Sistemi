import { useToast, type ToastType } from '../hooks/useToast';

const toastStyles: Record<ToastType, { bar: string; icon: string }> = {
  success: { bar: 'border-l-emerald-600', icon: 'check_circle' },
  error: { bar: 'border-l-error', icon: 'error' },
  info: { bar: 'border-l-primary-container', icon: 'info' },
  warning: { bar: 'border-l-amber-500', icon: 'warning' },
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 shadow-lg border-l-4 ${style.bar}`}
            role="status"
          >
            <span className="material-symbols-outlined text-[22px] text-primary shrink-0" aria-hidden="true">
              {style.icon}
            </span>
            <p className="flex-1 font-body-md text-body-md text-on-surface pt-0.5">{toast.message}</p>
            <button
              type="button"
              className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md border-0 bg-transparent p-0 text-on-surface-variant/70 appearance-none cursor-pointer transition-colors hover:bg-surface-container hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/20"
              aria-label="Bildirimi kapat"
              onClick={() => dismiss(toast.id)}
            >
              <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
