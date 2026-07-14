type DeleteCategoryModalProps = {
  open: boolean;
  categoryName: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteCategoryModal({
  open,
  categoryName,
  loading,
  error,
  onClose,
  onConfirm,
}: DeleteCategoryModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-labelledby="delete-category-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50"
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-primary/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-xl bg-surface text-left shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all sm:my-8 sm:w-full sm:max-w-lg border border-outline-variant">
            <div className="h-1.5 w-full bg-error" />
            <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-error-container sm:mx-0 sm:h-10 sm:w-10 border border-error/20">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3
                    className="font-headline-md text-body-lg font-bold leading-6 text-on-background"
                    id="delete-category-modal-title"
                  >
                    Kategori Sil
                  </h3>
                  <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                    <strong className="text-on-background">{categoryName}</strong> kategorisini
                    silmek istediğinize emin misiniz?
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
                className="inline-flex w-full justify-center rounded-lg bg-error px-5 py-2 font-label-md text-label-md text-on-error hover:bg-error/90 sm:w-auto shadow-sm transition-colors disabled:opacity-70"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-lg bg-surface px-5 py-2 font-label-md text-label-md text-primary border border-outline-variant hover:bg-surface-container sm:mt-0 sm:w-auto transition-colors"
                onClick={onClose}
                disabled={loading}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
