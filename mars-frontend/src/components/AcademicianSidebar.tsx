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

const hodFooterItems = [
  { label: 'Akademisyenler', path: ROUTES.HOD_ACADEMICIANS, icon: 'groups', end: false },
  { label: 'Bölüm İstatistikleri', path: ROUTES.HOD_STATISTICS, icon: 'bar_chart', end: false },
] as const;

export default function AcademicianSidebar({ mobileOpen, onClose }: ModuleSidebarProps) {
  const { user } = useAuth();
  const isHod = user?.role === ROLES.HOD;

  const roleNavItems = commonNavItems.map((item, index) =>
    index === 0 && isHod
      ? { ...item, path: ROUTES.HOD }
      : item,
  );
  const navItems = user?.role === ROLES.ACADEMICIAN || isHod
    ? [
        ...roleNavItems.slice(0, 3),
        {
          label: 'Randevularım',
          path: ROUTES.ACADEMICIAN_APPOINTMENTS,
          icon: 'event_note',
          end: false,
        },
        {
          label: 'Randevu Devri',
          path: ROUTES.ACADEMICIAN_DELEGATION_HISTORY,
          icon: 'swap_horiz',
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
      footerItems={isHod ? hodFooterItems : []}
      profilePath={isHod ? ROUTES.HOD_PROFILE : ROUTES.ACADEMICIAN_PROFILE}
    />
  );
}
