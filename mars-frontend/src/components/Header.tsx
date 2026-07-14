import marsLogo from '../assets/images/mars-logo.png';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, getRoleLabel } from '../constants';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="app-header bg-surface sticky top-0 z-40 border-b border-outline-variant flex justify-between items-center h-16 px-6 md:px-8">
      <div className="flex items-center gap-3">
        <img src={marsLogo} alt={`${APP_NAME} Logo`} className="h-10 w-auto object-contain" />
        <span className="font-headline-md text-headline-md text-primary tracking-wider hidden sm:inline">
          {APP_NAME}
        </span>
      </div>

      {user ? (
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">person</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-primary leading-tight">{user.fullName}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>
      ) : null}
    </header>
  );
}
