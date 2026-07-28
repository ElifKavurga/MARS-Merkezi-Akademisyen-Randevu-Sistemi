import { useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { useToast } from '../hooks/useToast';
import { changeMyPassword } from '../services/profileService';
import AdminActionButton from './AdminActionButton';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

const initialForm: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 100;

function resolveErrorMessage(error: unknown): string {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return 'Şifre güncellenemedi. Lütfen bilgileri kontrol edin.';
}

function validate(form: PasswordFormState): string | null {
  if (!form.currentPassword.trim()) {
    return 'Mevcut şifre zorunludur.';
  }
  if (!form.newPassword.trim()) {
    return 'Yeni şifre zorunludur.';
  }
  if (form.newPassword.length < PASSWORD_MIN_LENGTH || form.newPassword.length > PASSWORD_MAX_LENGTH) {
    return 'Yeni şifre 6-100 karakter arasında olmalıdır.';
  }
  if (!form.confirmNewPassword.trim()) {
    return 'Yeni şifre tekrarı zorunludur.';
  }
  if (form.newPassword !== form.confirmNewPassword) {
    return 'Yeni şifre ve tekrarı eşleşmiyor.';
  }
  return null;
}

type ChangePasswordSecurityCardProps = {
  className?: string;
  embedded?: boolean;
};

export default function ChangePasswordSecurityCard({
  className = '',
  embedded = false,
}: ChangePasswordSecurityCardProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PasswordFormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setForm(initialForm);
    setFormError(null);
  };

  const handleClose = () => {
    if (saving) {
      return;
    }
    setOpen(false);
    resetForm();
  };

  const updateField = (field: keyof PasswordFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validate(form);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await changeMyPassword(form);
      toast.success('Şifreniz başarıyla güncellendi.');
      setOpen(false);
      resetForm();
    } catch (error) {
      const message = resolveErrorMessage(error);
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const containerClassName = embedded
    ? `border-t border-outline-variant/40 px-4 py-3 sm:px-5 ${className}`
    : `overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm ${className}`;
  const contentClassName = embedded
    ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
    : 'flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5';

  return (
    <>
      <section className={containerClassName}>
        <div className={contentClassName}>
          <div className="min-w-0">
            <h2 className="font-headline-md text-body-lg text-on-background">Güvenlik</h2>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Hesabınızın şifresini güvenli şekilde güncelleyin.
            </p>
          </div>
          <AdminActionButton
            variant="primary"
            icon="lock_reset"
            type="button"
            onClick={() => setOpen(true)}
          >
            Şifreyi Değiştir
          </AdminActionButton>
        </div>
      </section>

      <ModalShell
        open={open}
        titleId="change-password-modal-title"
        onClose={handleClose}
        onSubmit={(event) => void submit(event)}
        disableBackdropClose={saving}
        maxWidthClass="sm:max-w-xl"
        footer={
          <ModalFormFooter
            submitting={saving}
            onCancel={handleClose}
            submitLabel="Kaydet"
          />
        }
      >
        <div className="px-4 py-5 sm:px-6">
          <ModalHeader
            titleId="change-password-modal-title"
            icon="lock_reset"
            title="Şifreyi Değiştir"
            description="Mevcut şifrenizi doğrulayarak yeni şifrenizi belirleyin."
          />

          <div className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Mevcut Şifre
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={(event) => updateField('currentPassword', event.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Yeni Şifre
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={(event) => updateField('newPassword', event.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Yeni Şifre (Tekrar)
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmNewPassword}
                  onChange={(event) => updateField('confirmNewPassword', event.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Yeni şifre 6-100 karakter arasında olmalıdır.
            </p>

            {formError ? (
              <div className="rounded-lg border border-error/30 bg-error-container/40 px-3 py-2 font-body-sm text-body-sm text-error">
                {formError}
              </div>
            ) : null}
          </div>
        </div>
      </ModalShell>
    </>
  );
}
