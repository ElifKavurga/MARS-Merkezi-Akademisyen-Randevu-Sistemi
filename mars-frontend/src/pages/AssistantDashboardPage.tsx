import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import DashboardDailySchedule from '../components/DashboardDailySchedule';
import DashboardEntityListCard from '../components/DashboardEntityListCard';
import DashboardPendingRequests from '../components/DashboardPendingRequests';
import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import { ASSISTANT_DASHBOARD_MESSAGES } from '../constants/assistantCourse';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useDashboardDailySchedule } from '../hooks/useDashboardDailySchedule';
import { useToast } from '../hooks/useToast';
import { getAssistantDashboard } from '../services/assistantCourseService';
import type { AssistantDashboardSummary } from '../types/assistantCourse';

export default function AssistantDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const dailySchedule = useDashboardDailySchedule();
  const [summary, setSummary] = useState<AssistantDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        setSummary(await getAssistantDashboard());
      } catch (err) {
        const message =
          isAxiosError(err) && err.response?.status === 403
            ? ASSISTANT_DASHBOARD_MESSAGES.ACCESS_DENIED
            : ASSISTANT_DASHBOARD_MESSAGES.LOAD_ERROR;
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [toast]);

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

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <DashboardDailySchedule
          className="lg:col-span-8"
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
          className="lg:col-span-4"
          appointments={summary?.pendingAppointments ?? []}
          loading={loading}
          errorMessage={error}
          appointmentsPath={ROUTES.ASSISTANT_APPOINTMENTS}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
