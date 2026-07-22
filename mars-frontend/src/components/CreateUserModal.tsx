import { useCallback, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import DepartmentSelect from './DepartmentSelect';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import RoleSelect from './RoleSelect';
import { FORM_FIELD_CLASS } from '../constants/ui';
import { createAdminUser } from '../services/adminUserService';
import type { CreateUserPayload } from '../types/user';

type CreateUserModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const INITIAL_FORM: CreateUserPayload = {
  fullName: '',
  institutionalEmail: '',
  password: '',
  roleId: 0,
  departmentId: 0,
};

export default function CreateUserModal({ open, onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserPayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = useCallback(() => {
    setForm(INITIAL_FORM);
    setError(null);
    onClose();
  }, [onClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.roleId || !form.departmentId) {
      setError('Rol ve bölüm seçimi zorunludur.');
      return;
    }

    setSubmitting(true);

    try {
      await createAdminUser({
        ...form,
        roleId: Number(form.roleId),
        departmentId: Number(form.departmentId),
      });
      setForm(INITIAL_FORM);
      onCreated();
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setError(backendMessage);
        } else if (err.response?.status === 409) {
          setError('Bu e-posta adresi zaten kayıtlı.');
        } else {
          setError('Kullanıcı oluşturulamadı. Lütfen tekrar deneyin.');
        }
      } else {
        setError('Kullanıcı oluşturulamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      titleId="create-user-modal-title"
      onClose={resetAndClose}
      onSubmit={handleSubmit}
      disableBackdropClose={submitting}
      footer={
        <ModalFormFooter submitting={submitting} onCancel={resetAndClose} submitLabel="Kaydet" />
      }
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="create-user-modal-title"
          icon="person_add"
          title="Kullanıcı Ekle"
          description="Yeni kullanıcı hesabı oluşturun."
        />

        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="create-fullName"
            >
              Ad Soyad
            </label>
            <input
              id="create-fullName"
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
              htmlFor="create-email"
            >
              Kurumsal E-posta
            </label>
            <input
              id="create-email"
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
              htmlFor="create-password"
            >
              Şifre
            </label>
            <input
              id="create-password"
              type="password"
              className={FORM_FIELD_CLASS}
              required
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="create-role"
            >
              Rol
            </label>
            <RoleSelect
              id="create-role"
              required
              disabled={submitting}
              value={form.roleId}
              onChange={(roleId) => setForm((prev) => ({ ...prev, roleId }))}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="create-department"
            >
              Bölüm
            </label>
            <DepartmentSelect
              id="create-department"
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
