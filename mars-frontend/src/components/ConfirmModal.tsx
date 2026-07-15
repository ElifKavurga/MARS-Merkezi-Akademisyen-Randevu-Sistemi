type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'İptal',
  loading = false,
  error = null,
  variant = 'danger',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) {
    return null;
  }

  const accentClass = variant === 'danger' ? 'bg-error' : 'bg-primary-container';
  const iconWrapClass =
    variant === 'danger'
      ? 'bg-error-container border-error/20 text-error'
      : 'bg-surface-container border-outline-variant text-primary';
  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-error text-on-error hover:bg-error/90'
      : 'bg-primary-container text-on-primary hover:bg-black';

  return (
    <div aria-labelledby="confirm-modal-title" aria-modal="true" className="fixed inset-0 z-50" role="dialog">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-primary/20 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
      />
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-xl bg-surface text-left shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all sm:my-8 sm:w-full sm:max-w-lg border border-outline-variant">
            <div className={`h-1.5 w-full ${accentClass}`} />
            <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
              <div className="sm:flex sm:items-start">
                <div
                  className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border sm:mx-0 sm:h-10 sm:w-10 ${iconWrapClass}`}
                >
                  <span className="material-symbols-outlined">
                    {variant === 'danger' ? 'warning' : 'help'}
                  </span>
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3
                    className="font-headline-md text-body-lg font-bold leading-6 text-on-background"
                    id="confirm-modal-title"
                  >
                    {title}
                  </h3>
                  <p className="mt-3 font-body-md text-body-md text-on-surface-variant whitespace-pre-line">
                    {description}
                  </p>
                  {error ? (
                    <p className="mt-3 font-label-sm text-label-sm text-error" role="alert">
                      {error}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="bg-surface-bright px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-outline-variant gap-2">
              <button
                type="button"
                className={`inline-flex w-full justify-center rounded-lg px-5 py-2 font-label-md text-label-md sm:w-auto shadow-sm transition-colors disabled:opacity-70 ${confirmBtnClass}`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                    Loading...
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-lg bg-surface px-5 py-2 font-label-md text-label-md text-primary border border-outline-variant hover:bg-surface-container sm:mt-0 sm:w-auto transition-colors"
                onClick={onClose}
                disabled={loading}
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
