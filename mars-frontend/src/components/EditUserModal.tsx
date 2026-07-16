import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import DepartmentSelect from './DepartmentSelect';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import RoleSelect from './RoleSelect';
import { FORM_FIELD_CLASS } from '../constants/ui';
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
    <ModalShell
      open={open}
      titleId="edit-user-modal-title"
      onClose={handleClose}
      onSubmit={handleSubmit}
      disableBackdropClose={submitting}
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="edit-user-modal-title"
          icon="edit"
          title="Kullanıcı Düzenle"
          description="Kullanıcı bilgilerini güncelleyin."
        />

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
              className={FORM_FIELD_CLASS}
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
              className={FORM_FIELD_CLASS}
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
    </ModalShell>
  );
}
