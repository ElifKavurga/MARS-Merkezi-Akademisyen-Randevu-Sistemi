import { useCallback, useEffect, useState } from 'react';
import {
  DashboardPendingAppointmentRow,
  DashboardUpcomingAppointmentRow,
} from '../components/DashboardAppointmentRows';
import DashboardEmptyState from '../components/DashboardEmptyState';
import DashboardQuickActions from '../components/DashboardQuickActions';
import DashboardSectionHeader from '../components/DashboardSectionHeader';
import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import Loading from '../components/Loading';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
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
                { label: 'Bekleyen', value: summary.pendingAppointmentCount },
                { label: 'Yaklaşan', value: summary.upcomingAppointmentCount },
                { label: 'Aktif Ders', value: summary.activeCourseCount },
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-8">
          <DashboardSectionHeader
            title="Yaklaşan Randevular"
            actionLabel="Tümünü Gör"
            actionPath={ROUTES.ACADEMICIAN_APPOINTMENTS}
          />
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {loading ? (
              <SectionLoading />
            ) : summary?.upcomingAppointments.length ? (
              <div className="divide-y divide-outline-variant">
                {summary.upcomingAppointments.map((appointment) => (
                  <DashboardUpcomingAppointmentRow
                    key={appointment.appointmentId}
                    appointment={appointment}
                  />
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                icon="event_available"
                message="Yaklaşan randevunuz bulunmuyor."
              />
            )}
          </div>
        </section>

        <div className="space-y-6 lg:col-span-4">
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
            <DashboardSectionHeader
              title="Bekleyen Talepler"
              actionLabel="Tümünü Gör"
              actionPath={ROUTES.ACADEMICIAN_APPOINTMENTS}
            />
            <div className="px-4 pb-4 sm:px-6 sm:pb-6">
              {loading ? (
                <SectionLoading />
              ) : summary?.pendingAppointments.length ? (
                <div className="space-y-3">
                  {summary.pendingAppointments.map((appointment) => (
                    <DashboardPendingAppointmentRow
                      key={appointment.appointmentId}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  icon="pending_actions"
                  message="Bekleyen randevu talebiniz bulunmuyor."
                />
              )}
            </div>
          </section>

          <DashboardQuickActions actions={QUICK_ACTIONS} />
        </div>
      </div>
    </div>
  );
}

function SectionLoading() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <Loading label="Veriler yükleniyor..." />
    </div>
  );
}

