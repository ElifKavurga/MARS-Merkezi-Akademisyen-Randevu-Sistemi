import { ROUTES } from '../constants';
import ModuleSidebar from './ModuleSidebar';
import type { ModuleSidebarProps } from './ModuleLayout';

const assistantNavItems = [
  {
    label: 'Ana Ekran',
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
  {
    label: 'Müsaitliklerim',
    path: ROUTES.ASSISTANT_AVAILABILITY,
    icon: 'schedule',
    end: true,
  },
  {
    label: 'Randevularım',
    path: ROUTES.ASSISTANT_APPOINTMENTS,
    icon: 'event_note',
    end: true,
  },
  {
    label: 'Randevu Devri',
    path: ROUTES.ASSISTANT_DELEGATION_HISTORY,
    icon: 'swap_horiz',
    end: true,
  },
  {
    label: 'Takvimim',
    path: ROUTES.ASSISTANT_CALENDAR,
    icon: 'calendar_month',
    end: true,
  },
] as const;

export default function AssistantSidebar({ mobileOpen, onClose }: ModuleSidebarProps) {
  return (
    <ModuleSidebar
      mobileOpen={mobileOpen}
      onClose={onClose}
      ariaLabel="Araştırma Görevlisi menüsü"
      navAriaLabel="Araştırma Görevlisi sayfa menüsü"
      navItems={assistantNavItems}
      profilePath={ROUTES.ASSISTANT_PROFILE}
    />
  );
}
