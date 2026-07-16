import { NavLink } from 'react-router-dom';
import MarsLogo from './MarsLogo';
import { ROUTES } from '../constants';

const academicianNavItems = [
  { label: 'Dashboard', path: ROUTES.ACADEMICIAN, icon: 'dashboard', end: true },
  { label: 'Derslerim', path: ROUTES.ACADEMICIAN_COURSES, icon: 'menu_book', end: false },
  { label: 'Ofis Saatleri', path: ROUTES.ACADEMICIAN_AVAILABILITY, icon: 'schedule', end: false },
  { label: 'Takvim', path: ROUTES.ACADEMICIAN_CALENDAR, icon: 'calendar_month', end: false },
  { label: 'Ofis Dışında', path: ROUTES.ACADEMICIAN_OUT_OF_OFFICE, icon: 'event_busy', end: false },
] as const;

type AcademicianSidebarProps = {
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

export default function AcademicianSidebar({ mobileOpen, onClose }: AcademicianSidebarProps) {
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
        aria-label="Akademisyen menü"
      >
        <div className="admin-sidebar__brand">
          <MarsLogo onDark className="admin-sidebar__logo" />
        </div>

        <nav className="admin-sidebar-nav" aria-label="Akademisyen sayfa menüsü">
          {academicianNavItems.map((item) => (
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
      </aside>
    </>
  );
}
