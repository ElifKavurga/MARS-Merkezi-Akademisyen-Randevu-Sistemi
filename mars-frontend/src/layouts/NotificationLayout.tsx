import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants/roles';
import AdminSidebar from '../components/AdminSidebar';
import AcademicianSidebar from '../components/AcademicianSidebar';
import AssistantSidebar from '../components/AssistantSidebar';
import ModuleLayout from '../components/ModuleLayout';
import StudentSidebar from '../components/StudentSidebar';
import MainLayout from './MainLayout';

export default function NotificationLayout() {
  const { user } = useAuth();
  switch (user?.role) {
    case ROLES.STUDENT:
      return <ModuleLayout Sidebar={StudentSidebar} />;
    case ROLES.ACADEMICIAN:
    case ROLES.HOD:
      return <ModuleLayout Sidebar={AcademicianSidebar} />;
    case ROLES.ASSISTANT:
      return <ModuleLayout Sidebar={AssistantSidebar} />;
    case ROLES.ADMIN:
      return <ModuleLayout Sidebar={AdminSidebar} />;
    default:
      return <MainLayout />;
  }
}
