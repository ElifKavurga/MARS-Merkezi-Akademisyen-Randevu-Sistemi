import { NavLink } from 'react-router-dom';
import MarsLogo from './MarsLogo';
import type { ModuleSidebarProps } from './ModuleLayout';

export type ModuleNavItem = {
  label: string;
  path: string;
  icon: string;
  end: boolean;
};

type ModuleSidebarComponentProps = ModuleSidebarProps & {
  ariaLabel: string;
  navAriaLabel: string;
  navItems: readonly ModuleNavItem[];
  footerItems?: readonly ModuleNavItem[];
};

function NavItem({ item, onClose }: { item: ModuleNavItem; onClose: () => void }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) =>
        ['admin-sidebar-link', isActive ? 'admin-sidebar-link--active' : ''].filter(Boolean).join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="admin-sidebar-icon material-symbols-outlined"
            style={{
              fontVariationSettings: isActive
                ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
            }}
            aria-hidden="true"
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function ModuleSidebar({
  mobileOpen,
  onClose,
  ariaLabel,
  navAriaLabel,
  navItems,
  footerItems = [],
}: ModuleSidebarComponentProps) {
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
        aria-label={ariaLabel}
      >
        <div className="admin-sidebar__brand">
          <MarsLogo onDark className="admin-sidebar__logo" />
        </div>

        <nav className="admin-sidebar-nav" aria-label={navAriaLabel}>
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} onClose={onClose} />
          ))}
        </nav>

        {footerItems.length > 0 ? (
          <div className="mt-auto border-t border-white/10 pt-3">
            {footerItems.map((item) => (
              <NavItem key={item.path} item={item} onClose={onClose} />
            ))}
          </div>
        ) : null}
      </aside>
    </>
  );
}
