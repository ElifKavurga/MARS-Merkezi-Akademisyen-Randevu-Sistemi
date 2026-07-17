import { ROUTES } from '../constants';
import ModuleSidebar from './ModuleSidebar';
import type { ModuleSidebarProps } from './ModuleLayout';

const academicianNavItems = [
  { label: 'Dashboard', path: ROUTES.ACADEMICIAN, icon: 'dashboard', end: true },
  { label: 'Derslerim', path: ROUTES.ACADEMICIAN_COURSES, icon: 'menu_book', end: false },
  { label: 'Ofis Saatleri', path: ROUTES.ACADEMICIAN_AVAILABILITY, icon: 'schedule', end: false },
  { label: 'Takvim', path: ROUTES.ACADEMICIAN_CALENDAR, icon: 'calendar_month', end: false },
  { label: 'Ofis Dışında', path: ROUTES.ACADEMICIAN_OUT_OF_OFFICE, icon: 'event_busy', end: false },
] as const;

export default function AcademicianSidebar({ mobileOpen, onClose }: ModuleSidebarProps) {
  return (
    <ModuleSidebar
      mobileOpen={mobileOpen}
      onClose={onClose}
      ariaLabel="Akademisyen menü"
      navAriaLabel="Akademisyen sayfa menüsü"
      navItems={academicianNavItems}
    />
  );
}
