import { useAuth } from '../contexts/AuthContext';
import { getRoleLabel } from '../constants';

export default function RoleWelcomeView() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-max-width mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Hoş Geldiniz
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Oturum bilgileriniz aşağıda listelenmiştir.
        </p>
      </div>

      <div className="app-welcome-card bg-surface-container-lowest rounded-xl p-6 md:p-8 max-w-lg space-y-4">
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-1">Ad Soyad</p>
          <p className="font-headline-md text-headline-md text-primary">{user.fullName}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-1">
            Kurumsal E-posta
          </p>
          <p className="font-body-md text-body-md text-on-surface">{user.institutionalEmail}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-1">Rol</p>
          <p className="font-body-md text-body-md text-on-surface">{getRoleLabel(user.role)}</p>
        </div>
      </div>
    </div>
  );
}
