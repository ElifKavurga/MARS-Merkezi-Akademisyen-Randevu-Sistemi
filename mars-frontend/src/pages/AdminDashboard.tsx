import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import CreateUserModal from '../components/CreateUserModal';
import EditUserModal from '../components/EditUserModal';
import { changeAdminUserStatus, getAdminUsers } from '../services/adminUserService';
import type { UserListItem } from '../types/user';
import {
  ADMIN_DEPARTMENT_OPTIONS,
  ADMIN_ROLE_OPTIONS,
  getRoleLabel,
} from '../constants';
import { formatDate, formatDateTime, getInitials } from '../utils';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

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

  const departmentOptions = useMemo(() => {
    const fromUsers = users
      .map((user) => user.department)
      .filter((name): name is string => typeof name === 'string' && name.length > 0);
    const fromCatalog = ADMIN_DEPARTMENT_OPTIONS.map((department) => department.label);
    return Array.from(new Set([...fromCatalog, ...fromUsers])).sort((a, b) =>
      a.localeCompare(b, 'tr'),
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }
      if (departmentFilter && user.department !== departmentFilter) {
        return false;
      }
      return true;
    });
  }, [users, roleFilter, departmentFilter]);

  const handleCreated = () => {
    setSuccessMessage('Kullanıcı başarıyla oluşturuldu.');
    void loadUsers();
  };

  const handleUpdated = () => {
    setSuccessMessage('Kullanıcı başarıyla güncellendi.');
    void loadUsers();
  };

  const handleToggleStatus = async (user: UserListItem) => {
    setStatusUpdatingId(user.userId);
    setError(null);
    try {
      const updated = await changeAdminUserStatus(user.userId);
      setSuccessMessage(
        updated.isActive
          ? 'Kullanıcı aktif hale getirildi.'
          : 'Kullanıcı pasif hale getirildi.',
      );
      await loadUsers();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setError(backendMessage);
        } else {
          setError('Kullanıcı durumu güncellenemedi.');
        }
      } else {
        setError('Kullanıcı durumu güncellenemedi.');
      }
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Kullanıcı Yönetimi</h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
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
              value={roleFilter}
              aria-label="Rol filtresi"
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="">Tüm Roller</option>
              {ADMIN_ROLE_OPTIONS.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.label}
                </option>
              ))}
            </select>
            <select
              className="py-2 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary text-sm"
              value={departmentFilter}
              aria-label="Bölüm filtresi"
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="">Tüm Bölümler</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
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

        <div className="admin-table-wrap">
          {loading ? (
            <p className="p-6 font-body-md text-on-surface-variant">Kullanıcılar yükleniyor...</p>
          ) : error ? (
            <p className="p-6 font-body-md text-error" role="alert">
              {error}
            </p>
          ) : filteredUsers.length === 0 ? (
            <p className="p-6 font-body-md text-on-surface-variant">
              {users.length === 0
                ? 'Kayıtlı kullanıcı bulunamadı.'
                : 'Seçilen filtrelere uygun kullanıcı bulunamadı.'}
            </p>
          ) : (
            <table className="admin-users-table text-left">
              <thead>
                <tr className="bg-surface-tint/5 border-b border-outline-variant">
                  <th className="col-name font-label-md text-label-md text-on-surface-variant font-semibold">
                    Ad Soyad
                  </th>
                  <th className="col-email font-label-md text-label-md text-on-surface-variant font-semibold">
                    Kurumsal E-posta
                  </th>
                  <th className="col-role font-label-md text-label-md text-on-surface-variant font-semibold">
                    Rol
                  </th>
                  <th className="col-dept font-label-md text-label-md text-on-surface-variant font-semibold">
                    Bölüm
                  </th>
                  <th className="col-status font-label-md text-label-md text-on-surface-variant font-semibold text-center">
                    Durum
                  </th>
                  <th className="col-date font-label-md text-label-md text-on-surface-variant font-semibold">
                    Oluşturulma Tarihi
                  </th>
                  <th className="col-actions font-label-md text-label-md text-on-surface-variant font-semibold text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredUsers.map((user) => {
                  const inactive = !user.isActive;
                  const statusBusy = statusUpdatingId === user.userId;
                  return (
                    <tr
                      key={user.userId}
                      className={`hover:bg-surface-container-low transition-colors group ${
                        inactive ? 'bg-surface-container-lowest/30' : ''
                      }`}
                    >
                      <td className="col-name">
                        <div
                          className={`flex min-w-0 items-center gap-2 ${inactive ? 'opacity-60' : ''}`}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-surface-tint/30 bg-surface-tint/20 text-[14px] text-primary">
                            {getInitials(user.fullName)}
                          </div>
                          <p className="col-name__text font-body-md text-body-md font-medium leading-tight text-on-background">
                            {user.fullName}
                          </p>
                        </div>
                      </td>
                      <td
                        className={`col-email font-body-md text-body-md text-on-surface-variant ${
                          inactive ? 'opacity-60' : ''
                        }`}
                        title={user.institutionalEmail}
                      >
                        {user.institutionalEmail}
                      </td>
                      <td
                        className={`col-role font-body-md text-body-md text-on-surface ${
                          inactive ? 'opacity-60' : ''
                        }`}
                        title={getRoleLabel(user.role)}
                      >
                        {getRoleLabel(user.role)}
                      </td>
                      <td
                        className={`col-dept font-body-md text-body-md text-on-surface ${
                          inactive ? 'opacity-60' : ''
                        }`}
                        title={user.department}
                      >
                        {user.department}
                      </td>
                      <td className="col-status text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-label-sm text-label-sm ${
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td
                        className={`col-date font-body-md text-body-md text-on-surface-variant ${
                          inactive ? 'opacity-60' : ''
                        }`}
                        title={formatDateTime(user.createdAt)}
                      >
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="col-actions">
                        <div className="col-actions__row">
                          {!inactive ? (
                            <AdminActionButton
                              variant="primary"
                              icon="edit"
                              onClick={() => setEditingUser(user)}
                            >
                              Düzenle
                            </AdminActionButton>
                          ) : null}
                          <AdminActionButton
                            variant="neutral"
                            icon={user.isActive ? 'pause_circle' : 'play_circle'}
                            onClick={() => void handleToggleStatus(user)}
                            disabled={statusBusy}
                          >
                            {statusBusy
                              ? '...'
                              : user.isActive
                                ? 'Pasif Yap'
                                : 'Aktif Yap'}
                          </AdminActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && filteredUsers.length > 0 ? (
          <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center text-sm font-label-md text-on-surface-variant">
            <div>
              Toplam {filteredUsers.length} kullanıcıdan 1-{filteredUsers.length} arası gösteriliyor
            </div>
          </div>
        ) : null}
      </div>

      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreated}
      />
      <EditUserModal
        open={editingUser != null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
