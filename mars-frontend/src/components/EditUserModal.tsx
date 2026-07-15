import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import DepartmentSelect from './DepartmentSelect';
import RoleSelect from './RoleSelect';
import { useDepartments } from '../hooks/useDepartments';
import { useRoles } from '../hooks/useRoles';
import { updateAdminUser } from '../services/adminUserService';
import type { UpdateUserPayload, UserListItem } from '../types/user';
import { resolveDepartmentIdByName, resolveRoleIdByName } from '../utils/catalogResolvers';

type EditUserModalProps = {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditUserModal({ open, user, onClose, onUpdated }: EditUserModalProps) {
  const { roles } = useRoles();
  const { departments } = useDepartments();
  const [form, setForm] = useState<UpdateUserPayload>({
    fullName: '',
    institutionalEmail: '',
    roleId: 0,
    departmentId: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) {
      return;
    }
    setForm({
      fullName: user.fullName,
      institutionalEmail: user.institutionalEmail,
      roleId: resolveRoleIdByName(roles, user.role),
      departmentId: resolveDepartmentIdByName(departments, user.department),
    });
    setError(null);
  }, [open, user, roles, departments]);

  if (!open || !user) {
    return null;
  }

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.roleId || !form.departmentId) {
      setError('Rol ve bölüm seçimi zorunludur.');
      return;
    }

    setSubmitting(true);

    try {
      await updateAdminUser(user.userId, {
        ...form,
        roleId: Number(form.roleId),
        departmentId: Number(form.departmentId),
      });
      onUpdated();
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setError(backendMessage);
        } else if (err.response?.status === 409) {
          setError('Bu e-posta adresi zaten kayıtlı.');
        } else {
          setError('Kullanıcı güncellenemedi. Lütfen tekrar deneyin.');
        }
      } else {
        setError('Kullanıcı güncellenemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      aria-labelledby="edit-user-modal-title"
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
                    <span className="material-symbols-outlined text-primary">edit</span>
                  </div>
                  <div>
                    <h3
                      className="font-headline-md text-body-lg font-bold leading-6 text-on-background"
                      id="edit-user-modal-title"
                    >
                      Kullanıcı Düzenle
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Kullanıcı bilgilerini güncelleyin.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label
                      className="block font-label-md text-label-md text-on-surface-variant"
                      htmlFor="edit-fullName"
                    >
                      Ad Soyad
                    </label>
                    <input
                      id="edit-fullName"
                      className="w-full py-2.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="block font-label-md text-label-md text-on-surface-variant"
                      htmlFor="edit-email"
                    >
                      Kurumsal E-posta
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      className="w-full py-2.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container"
                      required
                      value={form.institutionalEmail}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, institutionalEmail: e.target.value }))
                      }
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="block font-label-md text-label-md text-on-surface-variant"
                      htmlFor="edit-role"
                    >
                      Rol
                    </label>
                    <RoleSelect
                      id="edit-role"
                      required
                      disabled={submitting}
                      value={form.roleId}
                      onChange={(roleId) => setForm((prev) => ({ ...prev, roleId }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="block font-label-md text-label-md text-on-surface-variant"
                      htmlFor="edit-department"
                    >
                      Bölüm
                    </label>
                    <DepartmentSelect
                      id="edit-department"
                      required
                      disabled={submitting}
                      value={form.departmentId}
                      onChange={(departmentId) => setForm((prev) => ({ ...prev, departmentId }))}
                    />
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
                  {submitting ? 'Loading...' : 'Kaydet'}
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
