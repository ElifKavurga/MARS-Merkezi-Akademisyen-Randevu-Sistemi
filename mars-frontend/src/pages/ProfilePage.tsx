import { useAuth } from '../hooks/useAuth';
import { getRoleLabel, UI_LABELS } from '../constants';
import { getInitials } from '../utils/userDisplay';
import Loading from '../components/Loading';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <Loading variant="page" label={UI_LABELS.loading} />;
  }

  const fields = [
    { label: 'Ad Soyad', value: user.fullName },
    { label: 'Kurumsal E-Posta', value: user.institutionalEmail },
    { label: 'Rol', value: getRoleLabel(user.role) },
    ...(user.department != null && user.department.trim() !== ''
      ? [{ label: 'Bölüm', value: user.department }]
      : []),
    ...(user.isActive !== undefined
      ? [
          {
            label: 'Hesap Durumu',
            value: user.isActive ? 'Aktif' : 'Pasif',
          },
        ]
      : []),
  ] as const;

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Profilim</h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Hesap bilgilerinizi görüntüleyin. Bu sayfada düzenleme yapılamaz.
        </p>
      </div>

      <div className="max-w-3xl overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-4 border-b border-outline-variant p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant bg-surface-container-highest font-headline-md text-lg text-primary">
            {getInitials(user.fullName) || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-headline-md text-body-lg text-on-background">
              {user.fullName}
            </p>
            <p className="truncate font-body-md text-body-md text-on-surface-variant">
              {user.institutionalEmail}
            </p>
            <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-outline-variant/60">
          {fields.map((field) => (
            <div
              key={field.label}
              className="grid gap-1 px-6 py-4 sm:grid-cols-[12rem_1fr] sm:items-center"
            >
              <dt className="font-label-md text-label-md text-on-surface-variant">{field.label}</dt>
              <dd className="break-words font-body-md text-body-md text-on-surface">
                {field.label === 'Hesap Durumu' ? (
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-label-sm text-label-sm ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {field.value}
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
