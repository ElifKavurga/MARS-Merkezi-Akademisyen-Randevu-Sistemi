import { useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { createAdminUser } from '../services/adminUserService';
import type { CreateUserPayload } from '../types/user';
import { ADMIN_DEPARTMENT_OPTIONS, ADMIN_ROLE_OPTIONS } from '../constants/adminFormOptions';

type CreateUserModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const INITIAL_FORM: CreateUserPayload = {
  fullName: '',
  institutionalEmail: '',
  password: '',
  roleId: ADMIN_ROLE_OPTIONS[0]?.id ?? 1,
  departmentId: ADMIN_DEPARTMENT_OPTIONS[0]?.id ?? 1,
};

export default function CreateUserModal({ open, onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserPayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const resetAndClose = () => {
    setForm(INITIAL_FORM);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
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
    <div
      aria-labelledby="create-user-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50"
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-primary/20 backdrop-blur-sm transition-opacity"
        onClick={resetAndClose}
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-xl bg-surface text-left shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all sm:my-8 sm:w-full sm:max-w-lg border border-outline-variant">
            <div className="h-1.5 w-full bg-primary-container" />
            <form onSubmit={handleSubmit}>
              <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container border border-outline-variant">
                    <span className="material-symbols-outlined text-primary">person_add</span>
                  </div>
                  <div>
                    <h3
                      className="font-headline-md text-body-lg font-bold leading-6 text-on-background"
                      id="create-user-modal-title"
                    >
                      Kullanıcı Ekle
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Yeni kullanıcı hesabı oluşturun.
                    </p>
                  </div>
                </div>

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
                      htmlFor="create-email"
                    >
                      Kurumsal E-posta
                    </label>
                    <input
                      id="create-email"
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
                      htmlFor="create-password"
                    >
                      Şifre
                    </label>
                    <input
                      id="create-password"
                      type="password"
                      className="w-full py-2.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container"
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
                    <select
                      id="create-role"
                      className="w-full py-2.5 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container"
                      required
                      value={form.roleId}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, roleId: Number(e.target.value) }))
                      }
                      disabled={submitting}
                    >
                      {ADMIN_ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="block font-label-md text-label-md text-on-surface-variant"
                      htmlFor="create-department"
                    >
                      Bölüm
                    </label>
                    <select
                      id="create-department"
                      className="w-full py-2.5 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container"
                      required
                      value={form.departmentId}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, departmentId: Number(e.target.value) }))
                      }
                      disabled={submitting}
                    >
                      {ADMIN_DEPARTMENT_OPTIONS.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.label}
                        </option>
                      ))}
                    </select>
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
                  onClick={resetAndClose}
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
