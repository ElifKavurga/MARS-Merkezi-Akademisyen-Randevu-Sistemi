import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../hooks/useLogout';
import { getRoleLabel } from '../constants';
import '../styles/AppShell.css';

export default function AdminLayout() {
  const { user } = useAuth();
  const handleLogout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell admin-shell">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

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

          <div className="admin-topbar-actions">
            {user ? (
              <div className="admin-user-card">
                <div className="admin-user-card__avatar">
                  <span className="material-symbols-outlined text-xl text-primary">person</span>
                </div>
                <div className="admin-user-card__meta">
                  <span className="admin-user-card__name truncate">{user.fullName}</span>
                  <span className="admin-user-card__role truncate">{getRoleLabel(user.role)}</span>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
              aria-label="Çıkış Yap"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                logout
              </span>
              <span className="admin-logout-btn__label">Çıkış Yap</span>
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
