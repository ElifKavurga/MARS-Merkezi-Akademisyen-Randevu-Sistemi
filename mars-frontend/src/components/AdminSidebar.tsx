import { NavLink } from 'react-router-dom';
import MarsLogo from './MarsLogo';
import { ROUTES } from '../constants';

const adminNavItems = [
  { label: 'Dashboard', path: ROUTES.ADMIN, icon: 'dashboard', end: true },
  { label: 'Kullanıcı Yönetimi', path: ROUTES.ADMIN_USERS, icon: 'group', end: false },
  { label: 'Kategori Yönetimi', path: ROUTES.ADMIN_CATEGORIES, icon: 'category', end: false },
  { label: 'Ceza Kuralları', path: ROUTES.ADMIN_PENALTY_RULES, icon: 'gavel', end: false },
] as const;

type AdminSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

function NavItem({
  label,
  path,
  icon,
  end,
  onClose,
}: {
  label: string;
  path: string;
  icon: string;
  end: boolean;
  onClose: () => void;
}) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        ['admin-sidebar-link', isActive ? 'admin-sidebar-link--active' : ''].filter(Boolean).join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="admin-sidebar-icon material-symbols-outlined"
            style={
              isActive
                ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
                : { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
            }
            aria-hidden="true"
          >
            {icon}
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  return (
    <>
      <div
        className={`admin-sidebar-backdrop${mobileOpen ? ' admin-sidebar-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={`admin-sidebar${mobileOpen ? ' admin-sidebar--open' : ''}`}
        style={{ backgroundColor: 'rgb(11, 22, 65)' }}
        aria-label="Admin menü"
      >
        <div className="admin-sidebar__brand">
          <MarsLogo onDark className="admin-sidebar__logo" />
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin sayfa menüsü">
          {adminNavItems.map((item) => (
            <NavItem
              key={item.path}
              label={item.label}
              path={item.path}
              icon={item.icon}
              end={item.end}
              onClose={onClose}
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-3">
          <NavItem
            label="Profilim"
            path={ROUTES.ADMIN_PROFILE}
            icon="person"
            end={false}
            onClose={onClose}
          />
        </div>
      </aside>
    </>
  );
}
