import Loading from './Loading';
import ModalShell from './ModalShell';
import { UI_LABELS } from '../constants/ui';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  variant?: 'danger' | 'primary';
  zIndexClass?: string;
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
  zIndexClass,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
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
    <ModalShell
      open={open}
      titleId="confirm-modal-title"
      accentClass={accentClass}
      onClose={onClose}
      disableBackdropClose={loading}
      zIndexClass={zIndexClass}
      footer={
        <div className="bg-surface-bright px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-outline-variant gap-2">
          <button
            type="button"
            className={`inline-flex w-full justify-center rounded-lg px-5 py-2 font-label-md text-label-md shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70 sm:w-auto ${
              variant === 'danger'
                ? 'focus-visible:ring-error/40'
                : 'focus-visible:ring-primary-fixed-dim'
            } ${confirmBtnClass}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loading variant="inline" label={UI_LABELS.submitting} />
            ) : (
              confirmLabel
            )}
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-lg border border-outline-variant bg-surface px-5 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2 disabled:opacity-70 sm:mt-0 sm:w-auto"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
        </div>
      }
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <div className="sm:flex sm:items-start">
          <div
            className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border sm:mx-0 sm:h-10 sm:w-10 ${iconWrapClass}`}
          >
            <span className="material-symbols-outlined" aria-hidden>
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
    </ModalShell>
  );
}
