import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import CreateUserModal from '../components/CreateUserModal';
import DepartmentSelect from '../components/DepartmentSelect';
import EditUserModal from '../components/EditUserModal';
import Loading from '../components/Loading';
import RoleSelect from '../components/RoleSelect';
import { useToast } from '../hooks/useToast';
import { changeAdminUserStatus, getAdminUsers } from '../services/adminUserService';
import type { UserListItem } from '../types/user';
import { getRoleLabel, UI_LABELS } from '../constants';
import { formatDate, formatDateTime, getInitials } from '../utils';

export default function AdminDashboard() {
  const toast = useToast();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<UserListItem | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
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
    toast.success('Kullanıcı başarıyla oluşturuldu.');
    void loadUsers();
  };

  const handleUpdated = () => {
    toast.success('Kullanıcı başarıyla güncellendi.');
    void loadUsers();
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) {
      return;
    }
    setStatusUpdatingId(statusTarget.userId);
    setStatusError(null);
    try {
      const updated = await changeAdminUserStatus(statusTarget.userId);
      toast.success(
        updated.isActive
          ? 'Kullanıcı etkinleştirildi.'
          : 'Kullanıcı devre dışı bırakıldı.',
      );
      setStatusTarget(null);
      await loadUsers();
    } catch (err) {
      if (isAxiosError(err)) {
        setStatusError('Kullanıcı durumu güncellenemedi.');
      } else {
        setStatusError('Kullanıcı durumu güncellenemedi.');
      }
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Kullanıcı Yönetimi</h1>
        
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-wrap gap-2">
            <RoleSelect
              id="admin-role-filter"
              value={0}
              onChange={() => undefined}
              valueMode="name"
              nameValue={roleFilter}
              onNameChange={setRoleFilter}
              allowEmpty
              emptyLabel="Tüm Roller"
              className="py-2 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary text-sm"
            />
            <DepartmentSelect
              id="admin-department-filter"
              value={0}
              onChange={() => undefined}
              valueMode="name"
              nameValue={departmentFilter}
              onNameChange={setDepartmentFilter}
              allowEmpty
              emptyLabel="Tüm Bölümler"
              className="py-2 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary text-sm"
            />
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
            <Loading label="Kullanıcılar yükleniyor..." />
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
                            onClick={() => {
                              setStatusError(null);
                              setStatusTarget(user);
                            }}
                            disabled={statusBusy}
                          >
                            {statusBusy ? (
                              <Loading variant="inline" label={UI_LABELS.submitting} />
                            ) : user.isActive ? (
                              'Devre Dışı Bırak'
                            ) : (
                              'Etkinleştir'
                            )}
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
      <ConfirmModal
        open={statusTarget != null}
        title={statusTarget?.isActive ? 'Kullanıcıyı Devre Dışı Bırak' : 'Kullanıcıyı Etkinleştir'}
        description={
          statusTarget
            ? `${statusTarget.fullName} adlı kullanıcıyı ${
                statusTarget.isActive ? 'devre dışı bırakmak' : 'etkinleştirmek'
              } istediğinize emin misiniz?`
            : ''
        }
        confirmLabel={statusTarget?.isActive ? 'Devre Dışı Bırak' : 'Etkinleştir'}
        loading={statusUpdatingId != null}
        error={statusError}
        variant={statusTarget?.isActive ? 'danger' : 'primary'}
        onConfirm={() => void handleConfirmStatusChange()}
        onClose={() => {
          if (statusUpdatingId != null) {
            return;
          }
          setStatusTarget(null);
          setStatusError(null);
        }}
      />
    </div>
  );
}
