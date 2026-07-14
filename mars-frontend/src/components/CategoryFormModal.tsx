import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
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
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setError(backendMessage);
        } else {
          setError('Kategori kaydedilemedi. Lütfen tekrar deneyin.');
        }
      } else {
        setError('Kategori kaydedilemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      aria-labelledby="category-form-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50"
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-primary/20 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-xl bg-surface text-left shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all sm:my-8 sm:w-full sm:max-w-lg border border-outline-variant">
            <div className="h-1.5 w-full bg-primary-container" />
            <form onSubmit={handleSubmit}>
              <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container border border-outline-variant">
                    <span className="material-symbols-outlined text-primary">category</span>
                  </div>
                  <div>
                    <h3
                      className="font-headline-md text-body-lg font-bold leading-6 text-on-background"
                      id="category-form-modal-title"
                    >
                      {isEdit ? 'Kategori Düzenle' : 'Kategori Ekle'}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      {isEdit
                        ? 'Kategori bilgilerini güncelleyin.'
                        : 'Yeni randevu kategorisi tanımlayın.'}
                    </p>
                  </div>
                </div>

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
                      className="w-full py-2.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container"
                      required
                      value={form.categoryName}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, categoryName: e.target.value }))
                      }
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
                      className="w-full py-2.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container"
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
                      className="w-full py-2.5 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container"
                      required
                      value={form.categoryGroup}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, categoryGroup: e.target.value }))
                      }
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

              <div className="bg-surface-bright px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-outline-variant gap-2">
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md text-on-primary hover:bg-black sm:w-auto shadow-sm transition-colors disabled:opacity-70"
                  disabled={submitting}
                >
                  {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-surface px-5 py-2 font-label-md text-label-md text-primary border border-outline-variant hover:bg-surface-container sm:mt-0 sm:w-auto transition-colors"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
