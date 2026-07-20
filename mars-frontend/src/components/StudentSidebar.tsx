import { ROUTES } from '../constants';
import ModuleSidebar from './ModuleSidebar';
import type { ModuleSidebarProps } from './ModuleLayout';

const studentNavItems = [
  { label: 'Ana Sayfa', path: ROUTES.STUDENT, icon: 'dashboard', end: true },
  {
    label: 'Akademisyen Ara',
    path: ROUTES.STUDENT_ACADEMICIAN_SEARCH,
    icon: 'person_search',
    end: true,
  },
] as const;

export default function StudentSidebar({ mobileOpen, onClose }: ModuleSidebarProps) {
  return (
    <ModuleSidebar
      mobileOpen={mobileOpen}
      onClose={onClose}
      ariaLabel="Öğrenci menü"
      navAriaLabel="Öğrenci sayfa menüsü"
      navItems={studentNavItems}
      profilePath={ROUTES.STUDENT_PROFILE}
    />
  );
}
