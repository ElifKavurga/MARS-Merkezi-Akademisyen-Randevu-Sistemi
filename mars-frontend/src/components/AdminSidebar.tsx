import { ROUTES } from '../constants';
import ModuleSidebar from './ModuleSidebar';
import type { ModuleSidebarProps } from './ModuleLayout';

const adminNavItems = [
  { label: 'Ana Ekran', path: ROUTES.ADMIN, icon: 'dashboard', end: true },
  { label: 'Kullanıcı Yönetimi', path: ROUTES.ADMIN_USERS, icon: 'group', end: false },
  { label: 'Kategori Yönetimi', path: ROUTES.ADMIN_CATEGORIES, icon: 'category', end: false },
  { label: 'Ceza Kuralları', path: ROUTES.ADMIN_PENALTY_RULES, icon: 'gavel', end: false },
  { label: 'Sistem Durumu', path: ROUTES.ADMIN_SCHEDULER_STATUS, icon: 'monitor_heart', end: false },

] as const;

export default function AdminSidebar({ mobileOpen, onClose }: ModuleSidebarProps) {
  return (
    <ModuleSidebar
      mobileOpen={mobileOpen}
      onClose={onClose}
      ariaLabel="Admin menü"
      navAriaLabel="Admin sayfa menüsü"
      navItems={adminNavItems}
      profilePath={ROUTES.ADMIN_PROFILE}
    />
  );
}
