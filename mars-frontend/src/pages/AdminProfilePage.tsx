import { useAuth } from '../hooks/useAuth';
import { getRoleLabel } from '../constants';
import { getInitials } from '../utils';

export default function AdminProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const accountStatusLabel =
    user.isActive === undefined ? '—' : user.isActive ? 'Aktif' : 'Pasif';
  const departmentLabel = user.department?.trim() ? user.department : '—';

  const fields = [
    { label: 'Ad Soyad', value: user.fullName },
    { label: 'Kurumsal E-Posta', value: user.institutionalEmail },
    { label: 'Rol', value: getRoleLabel(user.role) },
    { label: 'Bölüm', value: departmentLabel },
    { label: 'Hesap Durumu', value: accountStatusLabel },
  ] as const;

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Profilim</h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Hesap bilgilerinizi görüntüleyin.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden max-w-3xl">
        <div className="p-6 border-b border-outline-variant flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-primary font-headline-md text-lg">
            {getInitials(user.fullName)}
          </div>
          <div className="min-w-0">
            <p className="font-headline-md text-body-lg text-on-background truncate">{user.fullName}</p>
            <p className="font-body-md text-body-md text-on-surface-variant truncate">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-outline-variant/60">
          {fields.map((field) => (
            <div
              key={field.label}
              className="px-6 py-4 grid gap-1 sm:grid-cols-[12rem_1fr] sm:items-center"
            >
              <dt className="font-label-md text-label-md text-on-surface-variant">{field.label}</dt>
              <dd className="font-body-md text-body-md text-on-surface break-words">
                {field.label === 'Hesap Durumu' && user.isActive !== undefined ? (
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-label-sm text-label-sm ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {accountStatusLabel}
                  </span>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
