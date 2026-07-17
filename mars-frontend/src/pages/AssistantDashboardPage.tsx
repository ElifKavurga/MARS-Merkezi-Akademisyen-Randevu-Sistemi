import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  DashboardPendingAppointmentRow,
  DashboardUpcomingAppointmentRow,
} from '../components/DashboardAppointmentRows';
import DashboardEmptyState from '../components/DashboardEmptyState';
import DashboardQuickActions from '../components/DashboardQuickActions';
import DashboardSectionHeader from '../components/DashboardSectionHeader';
import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import Loading from '../components/Loading';
import { ASSISTANT_DASHBOARD_MESSAGES } from '../constants/assistantCourse';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getAssistantDashboard } from '../services/assistantCourseService';
import type { AssistantDashboardSummary } from '../types/assistantCourse';

const QUICK_ACTIONS = [
  {
    route: ROUTES.ASSISTANT_APPOINTMENTS,
    icon: 'event_note',
    title: 'Randevularım',
    primary: true,
  },
  {
    route: ROUTES.ASSISTANT_CALENDAR,
    icon: 'calendar_month',
    title: 'Takvimim',
  },
  {
    route: ROUTES.ASSISTANT_AVAILABILITY,
    icon: 'event_available',
    title: 'Müsaitliklerim',
  },
] as const;

export default function AssistantDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
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
                },
                {
                  label: 'Yaklaşan',
                  value: summary.upcomingAppointmentCount,
                },
                {
                  label: 'Atanan Ders',
                  value: summary.assignedCourseCount,
                },
                {
                  label: 'Akademisyen',
                  value: summary.relatedAcademicianCount,
                },
              ]
            : []
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-8">
          <DashboardSectionHeader
            title="Yaklaşan Randevular"
            actionLabel="Tümünü Gör"
            actionPath={ROUTES.ASSISTANT_APPOINTMENTS}
          />
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {loading ? (
              <SectionLoading label="Randevular yükleniyor..." />
            ) : error || !summary ? (
              <SectionError message={error ?? ASSISTANT_DASHBOARD_MESSAGES.LOAD_ERROR} />
            ) : summary.upcomingAppointments.length === 0 ? (
              <DashboardEmptyState
                icon="event_available"
                message="Yaklaşan randevunuz bulunmuyor."
              />
            ) : (
              <div className="divide-y divide-outline-variant">
                {summary.upcomingAppointments.map((appointment) => (
                  <DashboardUpcomingAppointmentRow
                    key={appointment.appointmentId}
                    appointment={appointment}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-4">
          <DashboardSectionHeader
            title="Bekleyen Talepler"
            actionLabel="Tümünü Gör"
            actionPath={ROUTES.ASSISTANT_APPOINTMENTS}
          />
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {loading ? (
              <SectionLoading label="Talepler yükleniyor..." />
            ) : error || !summary ? (
              <SectionError message={error ?? ASSISTANT_DASHBOARD_MESSAGES.LOAD_ERROR} />
            ) : summary.pendingAppointments.length === 0 ? (
              <DashboardEmptyState
                icon="pending_actions"
                message="Bekleyen randevu talebiniz bulunmuyor."
              />
            ) : (
              <div className="space-y-3">
                {summary.pendingAppointments.map((appointment) => (
                  <DashboardPendingAppointmentRow
                    key={appointment.appointmentId}
                    appointment={appointment}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-8">
          <DashboardSectionHeader
            title={ASSISTANT_DASHBOARD_MESSAGES.PREVIEW_TITLE}
            actionLabel={ASSISTANT_DASHBOARD_MESSAGES.VIEW_ALL}
            actionPath={ROUTES.ASSISTANT_COURSES}
          />

          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {loading ? (
              <SectionLoading label="Dersler yükleniyor..." />
            ) : error || !summary ? (
              <SectionError message={error ?? ASSISTANT_DASHBOARD_MESSAGES.LOAD_ERROR} />
            ) : summary.assignedCoursesPreview.length === 0 ? (
              <DashboardEmptyState
                icon="menu_book"
                message={ASSISTANT_DASHBOARD_MESSAGES.EMPTY}
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-outline-variant">
                <table className="w-full min-w-[680px] border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container/40">
                      <th className="px-5 py-3 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                        Ders Kodu
                      </th>
                      <th className="px-5 py-3 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                        Ders Adı
                      </th>
                      <th className="px-5 py-3 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                        Dönem
                      </th>
                      <th className="px-5 py-3 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                        Sorumlu Akademisyen
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.assignedCoursesPreview.map((course) => (
                      <tr
                        key={course.courseId}
                        className="border-b border-outline-variant/40 last:border-b-0"
                      >
                        <td className="px-5 py-3 font-label-md text-label-md font-semibold text-on-background">
                          {course.courseCode}
                        </td>
                        <td className="px-5 py-3 font-body-md text-body-md text-on-background">
                          {course.courseName}
                        </td>
                        <td className="px-5 py-3 font-body-md text-body-md text-on-background">
                          {course.academicTerm}
                        </td>
                        <td className="px-5 py-3 font-body-md text-body-md text-on-background">
                          {course.ownerAcademicianName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <div className="lg:col-span-4">
          <DashboardQuickActions actions={QUICK_ACTIONS} />
        </div>
      </div>
    </div>
  );
}

function SectionLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <Loading label={label} />
    </div>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg bg-error-container/40 px-5 py-8 text-center">
      <p className="font-body-md text-body-md text-on-error-container" role="alert">
        {message}
      </p>
    </div>
  );
}
