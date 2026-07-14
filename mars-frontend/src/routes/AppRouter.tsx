import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import AdminDashboard from '../pages/AdminDashboard';
import HodDashboard from '../pages/HodDashboard';
import AcademicianDashboard from '../pages/AcademicianDashboard';
import AssistantDashboard from '../pages/AssistantDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import NotFoundPage from '../pages/NotFoundPage';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path={ROUTES.ADMIN} element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.HOD]} />}>
            <Route path={ROUTES.HOD} element={<HodDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.ACADEMICIAN]} />}>
            <Route path={ROUTES.ACADEMICIAN} element={<AcademicianDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.ASSISTANT]} />}>
            <Route path={ROUTES.ASSISTANT} element={<AssistantDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
            <Route path={ROUTES.STUDENT} element={<StudentDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
