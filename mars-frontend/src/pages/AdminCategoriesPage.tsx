import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import CategoryFormModal from '../components/CategoryFormModal';
import ConfirmModal from '../components/ConfirmModal';
import Loading from '../components/Loading';
import { useToast } from '../hooks/useToast';
import { deleteAdminCategory, getAdminCategories } from '../services/adminCategoryService';
import { getCategoryGroupLabel, type AppointmentCategory } from '../types/category';

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<AppointmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AppointmentCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<AppointmentCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCategories();
      setCategories(data);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setError('Bu sayfaya erişim yetkiniz yok.');
      } else {
        setError('Kategori listesi yüklenemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleSaved = (message: string) => {
    toast.success(message);
    void loadCategories();
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) {
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAdminCategory(deletingCategory.categoryId);
      setDeletingCategory(null);
      toast.success('Kategori başarıyla silindi.');
      await loadCategories();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setDeleteError('Kategori mevcut randevularda kullanıldığı için silinemez.');
      } else if (isAxiosError(err)) {
        setDeleteError('Kategori silinemedi.');
      } else {
        setDeleteError('Kategori silinemedi.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Kategori Yönetimi</h1>
        
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                category
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Sistemdeki randevu kategorileri
            </p>
          </div>
          <button
            type="button"
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Yeni Kategori Ekle
          </button>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <Loading label="Kategoriler yükleniyor..." />
          ) : error ? (
            <p className="p-6 font-body-md text-error" role="alert">
              {error}
            </p>
          ) : categories.length === 0 ? (
            <p className="p-6 font-body-md text-on-surface-variant">Kayıtlı kategori bulunamadı.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-tint/5 border-b border-outline-variant">
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Kategori Adı
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Süre (Dakika)
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Kategori Grubu
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Ders Seçimi Gerekli mi
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {categories.map((category) => (
                  <tr
                    key={category.categoryId}
                    className="hover:bg-surface-container-low transition-colors group"
                  >
                    <td className="py-4 px-6 font-body-md text-body-md text-on-background font-medium">
                      {category.categoryName}
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">
                      {category.durationMinutes}
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-on-surface-variant">
                        {getCategoryGroupLabel(category.categoryGroup)}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">
                      {category.requiresCourseSelection ? 'Evet' : 'Hayır'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <AdminActionButton
                          variant="primary"
                          icon="edit"
                          onClick={() => {
                            setEditingCategory(category);
                            setFormOpen(true);
                          }}
                        >
                          Düzenle
                        </AdminActionButton>
                        <AdminActionButton
                          variant="danger"
                          icon="delete"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingCategory(category);
                          }}
                        >
                          Sil
                        </AdminActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CategoryFormModal
        open={formOpen}
        category={editingCategory}
        onClose={() => {
          setFormOpen(false);
          setEditingCategory(null);
        }}
        onSaved={handleSaved}
      />
      <ConfirmModal
        open={deletingCategory != null}
        title="Kategori Sil"
        description={`${deletingCategory?.categoryName ?? ''} kategorisini silmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        loading={deleteLoading}
        error={deleteError}
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onClose={() => {
          setDeletingCategory(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
