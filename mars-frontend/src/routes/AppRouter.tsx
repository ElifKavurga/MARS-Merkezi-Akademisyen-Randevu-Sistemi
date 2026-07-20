import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import AcademicianLayout from '../layouts/AcademicianLayout';
import AssistantLayout from '../layouts/AssistantLayout';
import StudentLayout from '../layouts/StudentLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import AdminHomePage from '../pages/AdminHomePage';
import AdminDashboard from '../pages/AdminDashboard';
import AdminCategoriesPage from '../pages/AdminCategoriesPage';
import AdminPenaltyRulesPage from '../pages/AdminPenaltyRulesPage';
import HodDashboard from '../pages/HodDashboard';
import AcademicianDashboard from '../pages/AcademicianDashboard';
import AcademicianCoursesPage from '../pages/AcademicianCoursesPage';
import CourseDetailPage from '../pages/CourseDetailPage';
import AcademicianAvailabilityPage from '../pages/AcademicianAvailabilityPage';
import AcademicianAppointmentsPage from '../pages/AcademicianAppointmentsPage';
import AcademicianCalendarPage from '../pages/AcademicianCalendarPage';
import AcademicianOutOfOfficePage from '../pages/AcademicianOutOfOfficePage';
import AssistantDashboardPage from '../pages/AssistantDashboardPage';
import AssistantCoursesPage from '../pages/AssistantCoursesPage';
import AssistantAvailabilityPage from '../pages/AssistantAvailabilityPage';
import AssistantAppointmentsPage from '../pages/AssistantAppointmentsPage';
import AssistantIncomingDelegationsPage from '../pages/AssistantIncomingDelegationsPage';
import DelegationHistoryPage from '../pages/DelegationHistoryPage';
import AssistantCalendarPage from '../pages/AssistantCalendarPage';
import ProfilePage from '../pages/ProfilePage';
import StudentDashboard from '../pages/StudentDashboard';
import StudentAcademicianSearchPage from '../pages/StudentAcademicianSearchPage';
import StudentAcademicianProfilePage from '../pages/StudentAcademicianProfilePage';
import StudentAppointmentCreatePage from '../pages/StudentAppointmentCreatePage';
import StudentAppointmentsPage from '../pages/StudentAppointmentsPage';
import StudentAppointmentDetailPage from '../pages/StudentAppointmentDetailPage';
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
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
          <Route element={<StudentLayout />}>
            <Route path={ROUTES.STUDENT} element={<StudentDashboard />} />
            <Route
              path={ROUTES.STUDENT_ACADEMICIAN_SEARCH}
              element={<StudentAcademicianSearchPage />}
            />
            <Route
              path={ROUTES.STUDENT_ACADEMICIAN_PROFILE}
              element={<StudentAcademicianProfilePage />}
            />
            <Route
              path={ROUTES.STUDENT_APPOINTMENT_CREATE}
              element={<StudentAppointmentCreatePage />}
            />
            <Route path={ROUTES.STUDENT_APPOINTMENTS} element={<StudentAppointmentsPage />} />
            <Route
              path={ROUTES.STUDENT_APPOINTMENT_DETAIL}
              element={<StudentAppointmentDetailPage />}
            />
            <Route path={ROUTES.STUDENT_PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ASSISTANT]} />}>
          <Route element={<AssistantLayout />}>
            <Route
              path={ROUTES.ASSISTANT}
              element={<Navigate to={ROUTES.ASSISTANT_DASHBOARD} replace />}
            />
            <Route
              path={ROUTES.ASSISTANT_DASHBOARD}
              element={<AssistantDashboardPage />}
            />
            <Route path={ROUTES.ASSISTANT_COURSES} element={<AssistantCoursesPage />} />
            <Route
              path={ROUTES.ASSISTANT_AVAILABILITY}
              element={<AssistantAvailabilityPage />}
            />
            <Route
              path={ROUTES.ASSISTANT_APPOINTMENTS}
              element={<AssistantAppointmentsPage />}
            />
            <Route
              path={ROUTES.ASSISTANT_INCOMING_DELEGATIONS}
              element={<AssistantIncomingDelegationsPage />}
            />
            <Route
              path={ROUTES.ASSISTANT_DELEGATION_HISTORY}
              element={<DelegationHistoryPage />}
            />
            <Route path={ROUTES.ASSISTANT_CALENDAR} element={<AssistantCalendarPage />} />
            <Route path={ROUTES.ASSISTANT_PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ACADEMICIAN, ROLES.HOD]} />}>
          <Route element={<AcademicianLayout />}>
            <Route element={<ProtectedRoute allowedRoles={[ROLES.ACADEMICIAN]} />}>
              <Route path={ROUTES.ACADEMICIAN} element={<AcademicianDashboard />} />
            </Route>
            <Route path={ROUTES.ACADEMICIAN_COURSES} element={<AcademicianCoursesPage />} />
            <Route path={ROUTES.ACADEMICIAN_COURSE_DETAIL} element={<CourseDetailPage />} />
            <Route path={ROUTES.ACADEMICIAN_AVAILABILITY} element={<AcademicianAvailabilityPage />} />
            <Route element={<ProtectedRoute allowedRoles={[ROLES.ACADEMICIAN]} />}>
              <Route
                path={ROUTES.ACADEMICIAN_APPOINTMENTS}
                element={<AcademicianAppointmentsPage />}
              />
              <Route
                path={ROUTES.ACADEMICIAN_DELEGATION_HISTORY}
                element={<DelegationHistoryPage />}
              />
            </Route>
            <Route
              path={ROUTES.ACADEMICIAN_CALENDAR}
              element={
                <AcademicianCalendarPage
                  includeAppointments
                  subtitle="Müsaitliklerinizi ve size ait randevuları tek takvim üzerinden görüntüleyin."
                />
              }
            />
            <Route path={ROUTES.ACADEMICIAN_OUT_OF_OFFICE} element={<AcademicianOutOfOfficePage />} />
            <Route path={ROUTES.ACADEMICIAN_PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN} element={<AdminHomePage />} />
            <Route path={ROUTES.ADMIN_USERS} element={<AdminDashboard />} />
            <Route path={ROUTES.ADMIN_CATEGORIES} element={<AdminCategoriesPage />} />
            <Route path={ROUTES.ADMIN_PENALTY_RULES} element={<AdminPenaltyRulesPage />} />
            <Route path={ROUTES.ADMIN_PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
