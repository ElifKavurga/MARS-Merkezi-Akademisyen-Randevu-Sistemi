import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardDailySchedule from '../components/DashboardDailySchedule';
import DashboardEntityListCard from '../components/DashboardEntityListCard';
import DashboardKpiCard from '../components/DashboardKpiCard';
import DashboardPendingRequests from '../components/DashboardPendingRequests';
import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import { ASSISTANT_DASHBOARD_MESSAGES } from '../constants/assistantCourse';
import {
  ROUTES,
  assistantDelegationHistoryPath,
} from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useDashboardDailySchedule } from '../hooks/useDashboardDailySchedule';
import { useToast } from '../hooks/useToast';
import { useNotificationRealtimeRefresh } from '../hooks/useNotificationRealtimeRefresh';
import { getAssistantDashboard } from '../services/assistantCourseService';
import type { AssistantDashboardSummary } from '../types/assistantCourse';
import type { NotificationItem } from '../types/notification';

const isDashboardNotification = (notification: NotificationItem) =>
  notification.relatedAppointmentId != null || notification.relatedDelegationId != null;

export default function AssistantDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const dailySchedule = useDashboardDailySchedule();
  const retryDailySchedule = dailySchedule.retry;
  const [summary, setSummary] = useState<AssistantDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      setSummary(await getAssistantDashboard());
    } catch (err) {
      const message =
        isAxiosError(err) && err.response?.status === 403
          ? ASSISTANT_DASHBOARD_MESSAGES.ACCESS_DENIED
          : ASSISTANT_DASHBOARD_MESSAGES.LOAD_ERROR;
      if (!silent) {
        setError(message);
        toast.error(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const refreshRealtimeDashboard = useCallback(async () => {
    await Promise.allSettled([loadDashboard(true), retryDailySchedule()]);
  }, [loadDashboard, retryDailySchedule]);
  useNotificationRealtimeRefresh(isDashboardNotification, refreshRealtimeDashboard);

  const courseItems =
    summary?.assignedCoursesPreview.slice(0, 5).map((course) => ({
      id: course.courseId,
      title: course.courseName,
      subtitle: `${course.courseCode} · ${course.academicTerm}`,
    })) ?? [];

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <DashboardWelcomeBanner
        fullName={user?.fullName ?? ''}
        description="Atandığınız dersleri, randevularınızı ve müsaitliklerinizi tek yerden takip edin."
        loading={loading}
        loadingLabel="Akademik görev özetiniz yükleniyor..."
        stats={
          summary && !loading
            ? [
                {
                  label: 'Bekleyen',
                  value: summary.pendingAppointmentCount,
                  to: ROUTES.ASSISTANT_APPOINTMENTS,
                },
                {
                  label: 'Yaklaşan',
                  value: summary.upcomingAppointmentCount,
                  to: ROUTES.ASSISTANT_CALENDAR,
                },
                {
                  label: 'Atanan Ders',
                  value: summary.assignedCourseCount,
                  to: ROUTES.ASSISTANT_COURSES,
                },
              ]
            : []
        }
      />

      {error ? (
        <section className="mb-6 rounded-xl border border-error/30 bg-error-container/40 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="font-body-md text-body-md text-on-error-container">{error}</p>
            <button
              type="button"
              className="rounded-lg bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90"
              onClick={() => void loadDashboard()}
            >
              Tekrar Dene
            </button>
          </div>
        </section>
      ) : null}

      {summary ? (
        <section className="mb-5" aria-label="Randevu istatistikleri">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">event</span>
            <h2 className="font-headline-md text-headline-md text-on-background">Randevu İstatistikleri</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <DashboardKpiCard
              icon="pending"
              label="Bekleyen"
              value={summary.pendingAppointmentCount}
              onClick={() => navigate(`${ROUTES.ASSISTANT_APPOINTMENTS}?status=PENDING`)}
            />
            <DashboardKpiCard
              icon="today"
              label="Yaklaşan"
              value={summary.upcomingAppointmentCount}
              onClick={() => navigate(ROUTES.ASSISTANT_CALENDAR)}
            />
            <DashboardKpiCard
              icon="menu_book"
              label="Atanan Ders"
              value={summary.assignedCourseCount}
              onClick={() => navigate(ROUTES.ASSISTANT_COURSES)}
            />
            <DashboardKpiCard
              icon="hourglass_top"
              label="Bekleyen Devir"
              value={summary.pendingDelegationCount}
              onClick={() => navigate(ROUTES.ASSISTANT_INCOMING_DELEGATIONS)}
            />
            <DashboardKpiCard
              icon="check_circle"
              label="Kabul Edilen Devir"
              value={summary.acceptedDelegationCount}
              onClick={() => navigate(assistantDelegationHistoryPath('ACCEPTED'))}
            />
            <DashboardKpiCard
              icon="cancel"
              label="Reddedilen Devir"
              value={summary.rejectedDelegationCount}
              onClick={() => navigate(assistantDelegationHistoryPath('REJECTED'))}
            />
          </div>
        </section>
      ) : null}

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <DashboardDailySchedule
          className="lg:col-span-6"
          selectedDate={dailySchedule.selectedDate}
          events={dailySchedule.events}
          loading={dailySchedule.loading}
          error={dailySchedule.error}
          calendarPath={ROUTES.ASSISTANT_CALENDAR}
          onPreviousDay={dailySchedule.showPreviousDay}
          onNextDay={dailySchedule.showNextDay}
          onToday={dailySchedule.showToday}
          onRetry={() => void dailySchedule.retry()}
        />

        <DashboardPendingRequests
          className="lg:col-span-6"
          appointments={summary?.pendingAppointments ?? []}
          loading={loading}
          errorMessage={error}
          appointmentsPath={ROUTES.ASSISTANT_APPOINTMENTS}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DashboardEntityListCard
          title="Atandığım Dersler"
          items={courseItems}
          loading={loading}
          emptyMessage={ASSISTANT_DASHBOARD_MESSAGES.EMPTY}
          emptyIcon="menu_book"
          actionLabel="Tüm Dersleri Gör"
          actionPath={ROUTES.ASSISTANT_COURSES}
        />
      </div>
    </div>
  );
}
