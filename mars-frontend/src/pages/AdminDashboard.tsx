import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import CreateUserModal from '../components/CreateUserModal';
import { getAdminUsers } from '../services/adminUserService';
import type { UserListItem } from '../types/user';
import { getRoleLabel } from '../constants';
import { formatDateTime, getInitials } from '../utils';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setError('Bu sayfaya erişim yetkiniz yok.');
      } else {
        setError('Kullanıcı listesi yüklenemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreated = () => {
    setSuccessMessage('Kullanıcı başarıyla oluşturuldu.');
    void loadUsers();
  };

  return (
    <div className="max-w-max-width mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Kullanıcı Yönetimi</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Sistemdeki tüm kullanıcıları yönetin ve yetkilendirin.
        </p>
      </div>

      {successMessage ? (
        <div
          className="mb-4 p-4 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-between gap-3"
          role="status"
        >
          <p className="font-body-md text-body-md text-on-surface">{successMessage}</p>
          <button
            type="button"
            className="text-on-surface-variant hover:text-primary"
            aria-label="Mesajı kapat"
            onClick={() => setSuccessMessage(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      ) : null}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-wrap gap-2">
            <select
              className="py-2 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary text-sm"
              defaultValue=""
              aria-label="Rol filtresi"
              disabled
            >
              <option value="">Tüm Roller</option>
              <option>Akademisyen</option>
              <option>Öğrenci</option>
              <option>Asistan</option>
              <option>HOD</option>
            </select>
            <select
              className="py-2 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary text-sm"
              defaultValue=""
              aria-label="Bölüm filtresi"
              disabled
            >
              <option value="">Tüm Bölümler</option>
            </select>
          </div>
          <button
            type="button"
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2 self-start sm:self-auto"
            onClick={() => setCreateModalOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Yeni Kullanıcı
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          {loading ? (
            <p className="p-6 font-body-md text-on-surface-variant">Kullanıcılar yükleniyor...</p>
          ) : error ? (
            <p className="p-6 font-body-md text-error" role="alert">
              {error}
            </p>
          ) : users.length === 0 ? (
            <p className="p-6 font-body-md text-on-surface-variant">Kayıtlı kullanıcı bulunamadı.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-tint/5 border-b border-outline-variant">
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Ad Soyad
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Kurumsal E-posta
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Rol
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Bölüm
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-center">
                    Durum
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Oluşturulma Tarihi
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {users.map((user) => {
                  const inactive = !user.isActive;
                  return (
                    <tr
                      key={user.userId}
                      className={`hover:bg-surface-container-low transition-colors group ${
                        inactive ? 'bg-surface-container-lowest/30' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div
                          className={`flex items-center gap-3 ${inactive ? 'opacity-60' : ''}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-surface-tint/20 border border-surface-tint/30 flex items-center justify-center text-primary font-headline-md text-[16px] shrink-0">
                            {getInitials(user.fullName)}
                          </div>
                          <p className="font-body-md text-body-md text-on-background font-medium leading-tight">
                            {user.fullName}
                          </p>
                        </div>
                      </td>
                      <td
                        className={`py-4 px-6 font-body-md text-body-md text-on-surface-variant ${
                          inactive ? 'opacity-60' : ''
                        }`}
                      >
                        {user.institutionalEmail}
                      </td>
                      <td
                        className={`py-4 px-6 font-body-md text-body-md text-on-surface ${
                          inactive ? 'opacity-60' : ''
                        }`}
                      >
                        {getRoleLabel(user.role)}
                      </td>
                      <td
                        className={`py-4 px-6 font-body-md text-body-md text-on-surface ${
                          inactive ? 'opacity-60' : ''
                        }`}
                      >
                        {user.department}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-md font-label-sm text-label-sm ${
                            user.isActive
                              ? 'bg-surface-container text-on-surface'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-6 font-body-md text-body-md text-on-surface-variant whitespace-nowrap ${
                          inactive ? 'opacity-60' : ''
                        }`}
                      >
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {inactive ? (
                          <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant px-3 py-1.5 bg-surface-container rounded-md">
                            <span className="material-symbols-outlined text-[16px]">block</span>
                            Pasif
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="font-label-sm text-label-sm text-primary border border-primary px-3 py-1.5 rounded-md font-semibold opacity-60 cursor-not-allowed"
                            disabled
                          >
                            Rolü Güncelle
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && users.length > 0 ? (
          <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center text-sm font-label-md text-on-surface-variant">
            <div>
              Toplam {users.length} kullanıcıdan 1-{users.length} arası gösteriliyor
            </div>
          </div>
        ) : null}
      </div>

      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
