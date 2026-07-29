import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants/ui';
import { createAdminCategory, updateAdminCategory } from '../services/adminCategoryService';
import type { AppointmentCategory, AppointmentCategoryPayload } from '../types/category';
import { CATEGORY_GROUP_OPTIONS } from '../types/category';

type CategoryFormModalProps = {
  open: boolean;
  category: AppointmentCategory | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

const INITIAL_FORM: AppointmentCategoryPayload = {
  categoryName: '',
  durationMinutes: 30,
  categoryGroup: 'ACADEMIC',
  requiresCourseSelection: false,
};

export default function CategoryFormModal({
  open,
  category,
  onClose,
  onSaved,
}: CategoryFormModalProps) {
  const [form, setForm] = useState<AppointmentCategoryPayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = category != null;

  useEffect(() => {
    if (!open) {
      return;
    }
    if (category) {
      setForm({
        categoryName: category.categoryName,
        durationMinutes: category.durationMinutes,
        categoryGroup: category.categoryGroup,
        requiresCourseSelection: Boolean(category.requiresCourseSelection),
      });
    } else {
      setForm({ ...INITIAL_FORM });
    }
    setError(null);
  }, [open, category]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload: AppointmentCategoryPayload = {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      requiresCourseSelection: Boolean(form.requiresCourseSelection),
    };

    try {
      if (isEdit && category) {
        await updateAdminCategory(category.categoryId, payload);
        onSaved('Kategori başarıyla güncellendi.');
      } else {
        await createAdminCategory(payload);
        onSaved('Kategori başarıyla oluşturuldu.');
      }
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.status === 409
            ? 'Bu kategori mevcut kayıtlarla çakışıyor.'
            : 'Kategori kaydedilemedi. Lütfen tekrar deneyin.',
        );
      } else {
        setError('Kategori kaydedilemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      titleId="category-form-modal-title"
      onClose={handleClose}
      onSubmit={handleSubmit}
      disableBackdropClose={submitting}
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="category-form-modal-title"
          icon="category"
          title={isEdit ? 'Kategori Düzenle' : 'Kategori Ekle'}
          description={
            isEdit ? 'Kategori bilgilerini güncelleyin.' : 'Yeni randevu kategorisi tanımlayın.'
          }
        />

        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="category-name"
            >
              Kategori Adı
            </label>
            <input
              id="category-name"
              className={FORM_FIELD_CLASS}
              required
              value={form.categoryName}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryName: e.target.value }))}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="category-duration"
            >
              Süre (Dakika)
            </label>
            <input
              id="category-duration"
              type="number"
              min={1}
              className={FORM_FIELD_CLASS}
              required
              value={form.durationMinutes}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  durationMinutes: Number(e.target.value),
                }))
              }
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="category-group"
            >
              Kategori Grubu
            </label>
            <select
              id="category-group"
              className={FORM_SELECT_CLASS}
              required
              value={form.categoryGroup}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryGroup: e.target.value }))}
              disabled={submitting}
            >
              {CATEGORY_GROUP_OPTIONS.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Ders Seçimi Gerekli
            </span>
            <label className="mars-switch">
              <input
                id="category-requires-course"
                type="checkbox"
                checked={Boolean(form.requiresCourseSelection)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    requiresCourseSelection: event.target.checked,
                  }))
                }
                disabled={submitting}
              />
              <span className="mars-switch-track" aria-hidden="true" />
            </label>
          </div>

          {error ? (
            <p className="font-label-sm text-label-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}
