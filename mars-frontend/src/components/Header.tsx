import { useNavigate } from 'react-router-dom';
import marsLogo from '../assets/images/mars-logo.png';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, ROUTES, getRoleLabel } from '../constants';

export default function Header() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header className="app-header bg-surface sticky top-0 z-40 border-b border-outline-variant flex justify-between items-center h-16 px-6 md:px-8">
      <div className="flex items-center gap-3">
        <img src={marsLogo} alt={`${APP_NAME} Logo`} className="h-10 w-auto object-contain" />
        <span className="font-headline-md text-headline-md text-primary tracking-wider hidden sm:inline">
          {APP_NAME}
        </span>
      </div>

      {user ? (
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-3 pl-4 border-l border-outline-variant min-w-0">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-primary leading-tight truncate">
                {user.fullName}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight truncate">
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-error transition-colors"
            aria-label="Çıkış Yap"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              logout
            </span>
            <span className="font-label-sm text-label-sm hidden sm:inline">Çıkış Yap</span>
          </button>
        </div>
      ) : null}
    </header>
  );
}
