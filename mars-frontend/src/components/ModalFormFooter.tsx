import { UI_LABELS } from '../constants/ui';
import Loading from './Loading';

type ModalFormFooterProps = {
  submitting?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
};

export default function ModalFormFooter({
  submitting = false,
  submitDisabled = false,
  submitLabel = 'Kaydet',
  cancelLabel = 'İptal',
  onCancel,
}: ModalFormFooterProps) {
  return (
    <div className="bg-surface-bright px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-outline-variant gap-2">
      <button
        type="submit"
        className="inline-flex w-full justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md text-on-primary hover:bg-black sm:w-auto shadow-sm transition-colors disabled:opacity-70"
        disabled={submitting || submitDisabled}
      >
        {submitting ? (
          <Loading variant="inline" label={UI_LABELS.submitting} className="text-on-primary" />
        ) : (
          submitLabel
        )}
      </button>
      <button
        type="button"
        className="mt-3 inline-flex w-full justify-center rounded-lg bg-surface px-5 py-2 font-label-md text-label-md text-primary border border-outline-variant hover:bg-surface-container sm:mt-0 sm:w-auto transition-colors"
        onClick={onCancel}
        disabled={submitting}
      >
        {cancelLabel}
      </button>
    </div>
  );
}
