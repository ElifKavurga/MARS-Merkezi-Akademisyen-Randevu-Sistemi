import { ROUTES } from '../constants';
import { ROLES } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';
import ModuleSidebar from './ModuleSidebar';
import type { ModuleSidebarProps } from './ModuleLayout';

const commonNavItems = [
  { label: 'Ana Ekran', path: ROUTES.ACADEMICIAN, icon: 'dashboard', end: true },
  { label: 'Derslerim', path: ROUTES.ACADEMICIAN_COURSES, icon: 'menu_book', end: false },
  { label: 'Ofis Saatleri', path: ROUTES.ACADEMICIAN_AVAILABILITY, icon: 'schedule', end: false },
  { label: 'Takvim', path: ROUTES.ACADEMICIAN_CALENDAR, icon: 'calendar_month', end: false },
  { label: 'İzin Aralıkları', path: ROUTES.ACADEMICIAN_OUT_OF_OFFICE, icon: 'event_busy', end: false },
] as const;

export default function AcademicianSidebar({ mobileOpen, onClose }: ModuleSidebarProps) {
  const { user } = useAuth();
  const roleNavItems = commonNavItems.map((item, index) =>
    index === 0 && user?.role === ROLES.HOD
      ? { ...item, path: ROUTES.HOD }
      : item,
  );
  const navItems = user?.role === ROLES.ACADEMICIAN
    ? [
        ...roleNavItems.slice(0, 3),
        {
          label: 'Randevularım',
          path: ROUTES.ACADEMICIAN_APPOINTMENTS,
          icon: 'event_note',
          end: false,
        },
        {
          label: 'Randevu Devri Geçmişi',
          path: ROUTES.ACADEMICIAN_DELEGATION_HISTORY,
          icon: 'history',
          end: false,
        },
        ...roleNavItems.slice(3),
      ]
    : roleNavItems;

  return (
    <ModuleSidebar
      mobileOpen={mobileOpen}
      onClose={onClose}
      ariaLabel="Akademisyen menü"
      navAriaLabel="Akademisyen sayfa menüsü"
      navItems={navItems}
      profilePath={ROUTES.ACADEMICIAN_PROFILE}
    />
  );
}
