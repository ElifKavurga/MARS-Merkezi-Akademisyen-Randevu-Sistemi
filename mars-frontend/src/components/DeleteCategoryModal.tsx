import ConfirmModal from './ConfirmModal';

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
  return (
    <ConfirmModal
      open={open}
      title="Kategori Sil"
      description={`${categoryName} kategorisini silmek istediğinize emin misiniz?`}
      confirmLabel="Evet, Sil"
      cancelLabel="İptal"
      loading={loading}
      error={error}
      variant="danger"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
