import { ROUTES } from '../constants';
import { STUDENT_UI } from '../constants/studentUi';
import ModuleSidebar from './ModuleSidebar';
import type { ModuleSidebarProps } from './ModuleLayout';

const studentNavItems = [
  { label: STUDENT_UI.BREADCRUMB_HOME, path: ROUTES.STUDENT, icon: 'dashboard', end: true },
  {
    label: STUDENT_UI.BREADCRUMB_SEARCH,
    path: ROUTES.STUDENT_ACADEMICIAN_SEARCH,
    icon: 'person_search',
    end: true,
  },
  {
    label: STUDENT_UI.BREADCRUMB_APPOINTMENTS,
    path: ROUTES.STUDENT_APPOINTMENTS,
    icon: 'event_note',
    // Detail route (/randevularim/:id) should keep this nav item active.
    end: false,
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
