import { ROUTES } from '../constants';
import ModuleSidebar from './ModuleSidebar';
import type { ModuleSidebarProps } from './ModuleLayout';

const assistantNavItems = [
  {
    label: 'Dashboard',
    path: ROUTES.ASSISTANT_DASHBOARD,
    icon: 'dashboard',
    end: true,
  },
  {
    label: 'Atandığım Dersler',
    path: ROUTES.ASSISTANT_COURSES,
    icon: 'menu_book',
    end: true,
  },
] as const;

export default function AssistantSidebar({ mobileOpen, onClose }: ModuleSidebarProps) {
  return (
    <ModuleSidebar
      mobileOpen={mobileOpen}
      onClose={onClose}
      ariaLabel="Asistan menü"
      navAriaLabel="Asistan sayfa menüsü"
      navItems={assistantNavItems}
    />
  );
}
