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

  const navItems = [
    ...commonNavItems.slice(0, 3),
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
    ...commonNavItems.slice(3),
  ];

  return (
    <ModuleSidebar
      mobileOpen={mobileOpen}
      onClose={onClose}
      ariaLabel="Akademisyen menü"
      navAriaLabel="Akademisyen sayfa menüsü"
      navItems={navItems}
      footerItems={isHod ? hodFooterItems : []}
      profilePath={ROUTES.ACADEMICIAN_PROFILE}
    />
  );
}
