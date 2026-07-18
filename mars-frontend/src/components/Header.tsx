import marsLogo from '../assets/images/mars-logo.png';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../hooks/useLogout';
import { APP_NAME, getRoleLabel } from '../constants';

export default function Header() {
  const { user } = useAuth();
  const handleLogout = useLogout();

  return (
    <header className="app-header sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-6 md:px-8">
      <div className="flex items-center gap-3">
        <img src={marsLogo} alt={`${APP_NAME} Logo`} className="h-10 w-auto object-contain" />
        <span className="hidden font-headline-md text-headline-md tracking-wider text-primary sm:inline">
          {APP_NAME}
        </span>
      </div>

      {user ? (
        <div className="flex min-w-0 items-center gap-3">
          <NotificationBell />
          <div className="flex min-w-0 items-center gap-3 border-l border-outline-variant pl-4">
            <UserAvatar fullName={user.fullName} size="sm" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-label-md text-label-md leading-tight text-primary">
                {user.fullName}
              </span>
              <span className="truncate font-label-sm text-label-sm leading-tight text-on-surface-variant">
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-error"
            aria-label="Çıkış Yap"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              logout
            </span>
            <span className="hidden font-label-sm text-label-sm sm:inline">Çıkış Yap</span>
          </button>
        </div>
      ) : null}
    </header>
  );
}
