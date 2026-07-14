import { NavLink } from 'react-router-dom';
import MarsLogo from './MarsLogo';
import { APP_NAME, ROUTES } from '../constants';

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navItems = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: 'dashboard',
  },
] as const;

export default function Sidebar({
  drawerWidth,
  mobileOpen,
  onClose,
  isMobile,
}: SidebarProps) {
  const drawerContent = (
    <div className="flex h-full flex-col bg-[rgb(11,22,65)] text-white">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <MarsLogo onDark className="h-10 w-auto max-w-[7rem]" />
        <span className="font-headline-md text-sm font-bold tracking-wide truncate">{APP_NAME}</span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1" aria-label="Ana menü">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={() => {
              if (isMobile) {
                onClose();
              }
            }}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white font-bold'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              ].join(' ')
            }
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <nav
      className="shrink-0"
      style={{ width: isMobile ? undefined : drawerWidth }}
      aria-label="Yan menü"
    >
      <div
        className={`fixed inset-0 z-40 bg-[rgba(13,24,67,0.3)] backdrop-blur-sm md:hidden ${
          mobileOpen ? 'block' : 'hidden'
        }`}
        onClick={onClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-full md:hidden transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: drawerWidth }}
      >
        {drawerContent}
      </aside>

      <aside
        className="hidden md:fixed md:left-0 md:top-0 md:z-30 md:block md:h-full md:border-r md:border-outline-variant"
        style={{ width: drawerWidth }}
      >
        {drawerContent}
      </aside>
    </nav>
  );
}
