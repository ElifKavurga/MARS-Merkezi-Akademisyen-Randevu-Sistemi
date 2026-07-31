import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import AcademicianLayout from '../layouts/AcademicianLayout';
import AssistantLayout from '../layouts/AssistantLayout';
import StudentLayout from '../layouts/StudentLayout';
import NotificationLayout from '../layouts/NotificationLayout';
import ProtectedRoute from './ProtectedRoute';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AdminHomePage = lazy(() => import('../pages/AdminHomePage'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const AdminCategoriesPage = lazy(() => import('../pages/AdminCategoriesPage'));
const AdminPenaltyRulesPage = lazy(() => import('../pages/AdminPenaltyRulesPage'));
const AdminSchedulerStatusPage = lazy(() => import('../pages/AdminSchedulerStatusPage'));

const HodAcademiciansPage = lazy(() => import('../pages/HodAcademiciansPage'));
const HodAcademicianDetailPage = lazy(() => import('../pages/HodAcademicianDetailPage'));
const HodStatisticsPage = lazy(() => import('../pages/HodStatisticsPage'));
const AcademicianDashboard = lazy(() => import('../pages/AcademicianDashboard'));
const AcademicianCoursesPage = lazy(() => import('../pages/AcademicianCoursesPage'));
const CourseDetailPage = lazy(() => import('../pages/CourseDetailPage'));
const AcademicianAvailabilityPage = lazy(() => import('../pages/AcademicianAvailabilityPage'));
const AcademicianAppointmentsPage = lazy(() => import('../pages/AcademicianAppointmentsPage'));
const AcademicianAppointmentDetailPage = lazy(
  () => import('../pages/AcademicianAppointmentDetailPage'),
);
const AcademicianCalendarPage = lazy(() => import('../pages/AcademicianCalendarPage'));
const AcademicianOutOfOfficePage = lazy(() => import('../pages/AcademicianOutOfOfficePage'));
const AssistantDashboardPage = lazy(() => import('../pages/AssistantDashboardPage'));
const AssistantCoursesPage = lazy(() => import('../pages/AssistantCoursesPage'));
const AssistantAvailabilityPage = lazy(() => import('../pages/AssistantAvailabilityPage'));
const AssistantAppointmentsPage = lazy(() => import('../pages/AssistantAppointmentsPage'));
const DelegationManagementPage = lazy(() => import('../pages/DelegationManagementPage'));
const AcademicianIncomingDelegationDetailPage = lazy(
  () => import('../pages/AcademicianIncomingDelegationDetailPage'),
);
const AssistantCalendarPage = lazy(() => import('../pages/AssistantCalendarPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const StudentDashboard = lazy(() => import('../pages/StudentDashboard'));
const StudentAcademicianSearchPage = lazy(() => import('../pages/StudentAcademicianSearchPage'));
const StudentAcademicianProfilePage = lazy(
  () => import('../pages/StudentAcademicianProfilePage'),
);
const StudentAppointmentCreatePage = lazy(
  () => import('../pages/StudentAppointmentCreatePage'),
);
const StudentAppointmentsPage = lazy(() => import('../pages/StudentAppointmentsPage'));
const StudentAppointmentDetailPage = lazy(
  () => import('../pages/StudentAppointmentDetailPage'),
);

const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));

function RouteFallback() {
  return (
    <div className="flex min-h-48 items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span
          className="size-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
          aria-hidden
        />
        <span className="font-body-md text-body-md">Sayfa yükleniyor...</span>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<NotificationLayout />}>
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
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
              path={ROUTES.ASSISTANT_APPOINTMENT_DETAIL}
              element={
                <AcademicianAppointmentDetailPage
                  scope="assistant"
                  backTo={ROUTES.ASSISTANT_APPOINTMENTS}
                />
              }
            />
            <Route
              path={ROUTES.ASSISTANT_INCOMING_DELEGATIONS}
              element={<DelegationManagementPage />}
            />
            <Route
              path={ROUTES.ASSISTANT_DELEGATION_HISTORY}
              element={<DelegationManagementPage />}
            />
            <Route
              path={ROUTES.ASSISTANT_DELEGATION_DETAIL}
              element={<AcademicianIncomingDelegationDetailPage />}
            />
            <Route path={ROUTES.ASSISTANT_CALENDAR} element={<AssistantCalendarPage />} />
            <Route path={ROUTES.ASSISTANT_OUT_OF_OFFICE} element={<AcademicianOutOfOfficePage />} />
            <Route path={ROUTES.ASSISTANT_PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ACADEMICIAN]} />}>
          <Route element={<AcademicianLayout />}>
            <Route path={ROUTES.ACADEMICIAN} element={<AcademicianDashboard />} />
            <Route element={<ProtectedRoute allowedRoles={[ROLES.HOD]} />}>
              <Route path={ROUTES.HOD_ACADEMICIANS} element={<HodAcademiciansPage />} />
              <Route path={ROUTES.HOD_ACADEMICIAN_DETAIL} element={<HodAcademicianDetailPage />} />
              <Route path={ROUTES.HOD_STATISTICS} element={<HodStatisticsPage />} />
            </Route>
            <Route path={ROUTES.ACADEMICIAN_COURSES} element={<AcademicianCoursesPage />} />
            <Route path={ROUTES.ACADEMICIAN_COURSE_DETAIL} element={<CourseDetailPage />} />
            <Route path={ROUTES.ACADEMICIAN_AVAILABILITY} element={<AcademicianAvailabilityPage />} />
            <Route
              path={ROUTES.ACADEMICIAN_APPOINTMENTS}
              element={<AcademicianAppointmentsPage />}
            />
            <Route
              path={ROUTES.ACADEMICIAN_APPOINTMENT_DETAIL}
              element={<AcademicianAppointmentDetailPage />}
            />
            <Route
              path={ROUTES.ACADEMICIAN_DELEGATION_HISTORY}
              element={<DelegationManagementPage />}
            />
            <Route
              path={ROUTES.ACADEMICIAN_INCOMING_DELEGATIONS}
              element={<DelegationManagementPage />}
            />
            <Route
              path={ROUTES.ACADEMICIAN_INCOMING_DELEGATION_DETAIL}
              element={<AcademicianIncomingDelegationDetailPage />}
            />
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
            <Route path={ROUTES.ADMIN_SCHEDULER_STATUS} element={<AdminSchedulerStatusPage />} />
            <Route path={ROUTES.ADMIN_PROFILE} element={<ProfilePage />} />

          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
