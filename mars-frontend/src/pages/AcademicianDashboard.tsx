import { useCallback, useEffect, useState } from 'react';
import DashboardDailySchedule from '../components/DashboardDailySchedule';
import DashboardPendingRequests from '../components/DashboardPendingRequests';
import DashboardQuickActions from '../components/DashboardQuickActions';
import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useDashboardDailySchedule } from '../hooks/useDashboardDailySchedule';
import { useToast } from '../hooks/useToast';
import { getAcademicianDashboardSummary } from '../services/academicianDashboardService';
import type { AcademicianDashboardSummary } from '../types/dashboard';

const QUICK_ACTIONS = [
  {
    route: ROUTES.ACADEMICIAN_APPOINTMENTS,
    icon: 'event_note',
    title: 'Randevularım',
    primary: true,
  },
  {
    route: ROUTES.ACADEMICIAN_CALENDAR,
    icon: 'calendar_month',
    title: 'Takvimi Gör',
  },
  {
    route: ROUTES.ACADEMICIAN_AVAILABILITY,
    icon: 'event_available',
    title: 'Ofis Saatlerini Yönet',
  },
  {
    route: ROUTES.ACADEMICIAN_COURSES,
    icon: 'menu_book',
    title: 'Derslerim',
  },
] as const;

export default function AcademicianDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const dailySchedule = useDashboardDailySchedule();
  const [summary, setSummary] = useState<AcademicianDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await getAcademicianDashboardSummary());
    } catch {
      const message = 'Dashboard verileri yüklenirken bir hata oluştu.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (!user) {
    return null;
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <DashboardWelcomeBanner
        fullName={user.fullName}
        description="Randevularınızı, derslerinizi ve akademik programınızı tek yerden takip edin."
        loading={loading}
        stats={
          summary && !loading
            ? [
                {
                  label: 'Bekleyen',
                  value: summary.pendingAppointmentCount,
                  to: ROUTES.ACADEMICIAN_APPOINTMENTS,
                },
                {
                  label: 'Yaklaşan',
                  value: summary.upcomingAppointmentCount,
                  to: ROUTES.ACADEMICIAN_CALENDAR,
                },
                {
                  label: 'Aktif Ders',
                  value: summary.activeCourseCount,
                  to: ROUTES.ACADEMICIAN_COURSES,
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
              onClick={() => void loadSummary()}
            >
              Tekrar Dene
            </button>
          </div>
        </section>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <DashboardDailySchedule
          className="lg:col-span-8"
          selectedDate={dailySchedule.selectedDate}
          events={dailySchedule.events}
          loading={dailySchedule.loading}
          error={dailySchedule.error}
          calendarPath={ROUTES.ACADEMICIAN_CALENDAR}
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
          appointmentsPath={ROUTES.ACADEMICIAN_APPOINTMENTS}
        />
      </div>

      <DashboardQuickActions actions={QUICK_ACTIONS} />
    </div>
  );
}
