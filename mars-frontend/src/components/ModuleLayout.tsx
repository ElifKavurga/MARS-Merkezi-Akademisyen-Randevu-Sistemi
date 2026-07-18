import { useState, type ComponentType } from 'react';
import { Outlet } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import '../styles/AppShell.css';

export type ModuleSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

type ModuleLayoutProps = {
  Sidebar: ComponentType<ModuleSidebarProps>;
};

export default function ModuleLayout({ Sidebar }: ModuleLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell admin-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="admin-main">
        <header className="app-header admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label="Menüyü aç"
            onClick={() => setMobileOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="admin-topbar-actions ml-auto">
            <NotificationBell />
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
