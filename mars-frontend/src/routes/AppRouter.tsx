import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import AcademicianLayout from '../layouts/AcademicianLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import AdminHomePage from '../pages/AdminHomePage';
import AdminDashboard from '../pages/AdminDashboard';
import AdminCategoriesPage from '../pages/AdminCategoriesPage';
import AdminPenaltyRulesPage from '../pages/AdminPenaltyRulesPage';
import AdminProfilePage from '../pages/AdminProfilePage';
import HodDashboard from '../pages/HodDashboard';
import AcademicianDashboard from '../pages/AcademicianDashboard';
import AcademicianCoursesPage from '../pages/AcademicianCoursesPage';
import CourseDetailPage from '../pages/CourseDetailPage';
import AcademicianAvailabilityPage from '../pages/AcademicianAvailabilityPage';
import AcademicianCalendarPage from '../pages/AcademicianCalendarPage';
import AcademicianOutOfOfficePage from '../pages/AcademicianOutOfOfficePage';
import AssistantDashboard from '../pages/AssistantDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import StudentAppointmentCreatePage from '../pages/StudentAppointmentCreatePage';
import NotFoundPage from '../pages/NotFoundPage';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

          <Route element={<ProtectedRoute allowedRoles={[ROLES.HOD]} />}>
            <Route path={ROUTES.HOD} element={<HodDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.ASSISTANT]} />}>
            <Route path={ROUTES.ASSISTANT} element={<AssistantDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
            <Route path={ROUTES.STUDENT} element={<StudentDashboard />} />
            <Route path={ROUTES.STUDENT_APPOINTMENT_CREATE} element={<StudentAppointmentCreatePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ACADEMICIAN, ROLES.HOD]} />}>
          <Route element={<AcademicianLayout />}>
            <Route path={ROUTES.ACADEMICIAN} element={<AcademicianDashboard />} />
            <Route path={ROUTES.ACADEMICIAN_COURSES} element={<AcademicianCoursesPage />} />
            <Route path={ROUTES.ACADEMICIAN_COURSE_DETAIL} element={<CourseDetailPage />} />
            <Route path={ROUTES.ACADEMICIAN_AVAILABILITY} element={<AcademicianAvailabilityPage />} />
            <Route path={ROUTES.ACADEMICIAN_CALENDAR} element={<AcademicianCalendarPage />} />
            <Route path={ROUTES.ACADEMICIAN_OUT_OF_OFFICE} element={<AcademicianOutOfOfficePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN} element={<AdminHomePage />} />
            <Route path={ROUTES.ADMIN_USERS} element={<AdminDashboard />} />
            <Route path={ROUTES.ADMIN_CATEGORIES} element={<AdminCategoriesPage />} />
            <Route path={ROUTES.ADMIN_PENALTY_RULES} element={<AdminPenaltyRulesPage />} />
            <Route path={ROUTES.ADMIN_PROFILE} element={<AdminProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
