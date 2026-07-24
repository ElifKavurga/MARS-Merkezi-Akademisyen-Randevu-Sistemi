import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants/roles';
import AcademicianLayout from './AcademicianLayout';
import AdminLayout from './AdminLayout';
import AssistantLayout from './AssistantLayout';
import MainLayout from './MainLayout';
import StudentLayout from './StudentLayout';

export default function NotificationLayout() {
  const { user } = useAuth();
  switch (user?.role) {
    case ROLES.STUDENT: return <StudentLayout />;
    case ROLES.ACADEMICIAN: return <AcademicianLayout />;
    case ROLES.HOD: return <AcademicianLayout />;
    case ROLES.ASSISTANT: return <AssistantLayout />;
    case ROLES.ADMIN: return <AdminLayout />;
    default: return <MainLayout />;
  }
}
