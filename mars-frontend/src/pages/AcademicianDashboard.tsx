import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardDailySchedule from '../components/DashboardDailySchedule';
import DashboardEntityListCard from '../components/DashboardEntityListCard';
import DashboardKpiCard from '../components/DashboardKpiCard';
import DashboardPendingRequests from '../components/DashboardPendingRequests';
import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import {
  ROUTES,
  academicianDelegationHistoryPath,
} from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useDashboardDailySchedule } from '../hooks/useDashboardDailySchedule';
import { useToast } from '../hooks/useToast';
import { useNotificationRealtimeRefresh } from '../hooks/useNotificationRealtimeRefresh';
import { getAcademicianDashboardSummary, getDashboardStats } from '../services/academicianDashboardService';
import { getCourseAssistants, getMyCourses } from '../services/courseService';
import { LineChart, BarChart, DoughnutChart } from '../components/charts';
import type { HodDepartmentStatsDto } from '../types/hod';
import type { CourseAssistant } from '../types/course';
import type { AcademicianDashboardSummary } from '../types/dashboard';
import type { NotificationItem } from '../types/notification';

const PREVIEW_LIMIT = 5;
const STATUS_COLORS = ['#f59e0b', '#6366f1', '#ef4444', '#10b981', '#64748b', '#ec4899'];
const ACADEMICIAN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekleyen öğrenciler',
  APPROVED: 'Onaylanan öğrenciler',
  REJECTED: 'Reddedilen öğrenciler',
  COMPLETED: 'Tamamlanan öğrenciler',
  NO_SHOW: 'Katılmayan öğrenciler',
  CANCELLED: 'İptal edilen öğrenciler',
  CANCELLED_BY_STUDENT: 'Öğrenci iptalleri',
  CANCELLED_BY_ACADEMICIAN: 'Akademisyen iptalleri',
};
const APPOINTMENT_STATUS_FILTERS = new Set([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
]);

const isDashboardNotification = (notification: NotificationItem) =>
  notification.relatedAppointmentId != null || notification.relatedDelegationId != null;

function appointmentListPath(params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return `${ROUTES.ACADEMICIAN_APPOINTMENTS}?${searchParams.toString()}`;
}

function getStatusCount(stats: HodDepartmentStatsDto | null, status: string): number {
  return stats?.statusDistribution.find((item) => item.status === status)?.count ?? 0;
}

function getStatusStudentLabel(status: string): string {
  const normalizedStatus = status.trim().toUpperCase();
  if (ACADEMICIAN_STATUS_LABELS[normalizedStatus]) {
    return ACADEMICIAN_STATUS_LABELS[normalizedStatus];
  }
  if (normalizedStatus.startsWith('CANCELLED_BY_STUDENT')) {
    return 'Öğrenci iptalleri';
  }
  if (normalizedStatus.startsWith('CANCELLED_BY_ACADEMICIAN')) {
    return 'Akademisyen iptalleri';
  }
  if (normalizedStatus.startsWith('CANCELLED')) {
    return 'İptal edilen öğrenciler';
  }
  return status;
}

function getAppointmentStatusFilter(status: string): string {
  const normalizedStatus = status.trim().toUpperCase();
  if (APPOINTMENT_STATUS_FILTERS.has(normalizedStatus)) {
    return normalizedStatus;
  }
  if (normalizedStatus.startsWith('CANCELLED')) {
    return 'CANCELLED';
  }
  return 'ALL';
}

export default function AcademicianDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const dailySchedule = useDashboardDailySchedule();
  const retryDailySchedule = dailySchedule.retry;
  const [summary, setSummary] = useState<AcademicianDashboardSummary | null>(null);
  const [stats, setStats] = useState<HodDepartmentStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseItems, setCourseItems] = useState<
    Array<{ id: number; title: string; subtitle: string }>
  >([]);
  const [assistantItems, setAssistantItems] = useState<
    Array<{ id: number; title: string; subtitle: string }>
  >([]);
  const [listsLoading, setListsLoading] = useState(true);

  const loadSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const [summaryData, statsData] = await Promise.all([
        getAcademicianDashboardSummary(),
        getDashboardStats()
      ]);
      setSummary(summaryData);
      setStats(statsData);
    } catch {
      const message = 'Ana ekran verileri yüklenirken bir hata oluştu.';
      if (!silent) {
        setError(message);
        toast.error(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  const loadCourseLists = useCallback(async () => {
    setListsLoading(true);
    try {
      const courses = await getMyCourses();
      const activeCourses = courses.filter((course) => course.isActive);
      setCourseItems(
        activeCourses.slice(0, PREVIEW_LIMIT).map((course) => ({
          id: course.courseId,
          title: course.courseName,
          subtitle: `${course.courseCode} · ${course.academicTerm}`,
        })),
      );

      const assistantLists = await Promise.all(
        activeCourses.slice(0, PREVIEW_LIMIT).map(async (course) => {
          try {
            return await getCourseAssistants(course.courseId);
          } catch {
            return [] as CourseAssistant[];
          }
        }),
      );

      const uniqueAssistants = new Map<number, CourseAssistant>();
      for (const list of assistantLists) {
        for (const assistant of list) {
          if (!uniqueAssistants.has(assistant.assistantId)) {
            uniqueAssistants.set(assistant.assistantId, assistant);
          }
        }
      }

      setAssistantItems(
        Array.from(uniqueAssistants.values())
          .slice(0, PREVIEW_LIMIT)
          .map((assistant) => ({
            id: assistant.assistantId,
            title: assistant.assistantName,
            subtitle: assistant.departmentName || assistant.institutionalEmail,
          })),
      );
    } catch {
      setCourseItems([]);
      setAssistantItems([]);
    } finally {
      setListsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadCourseLists();
  }, [loadCourseLists]);

  const refreshRealtimeDashboard = useCallback(async () => {
    await Promise.allSettled([loadSummary(true), retryDailySchedule()]);
  }, [loadSummary, retryDailySchedule]);
  useNotificationRealtimeRefresh(isDashboardNotification, refreshRealtimeDashboard);

  if (!user) {
    return null;
  }

  const weeklyData = stats?.weeklyTrend.map(d => ({ label: d.date, value: d.count })) ?? [];
  const categoryData = stats?.categoryDistribution.map(d => ({ label: d.categoryName, value: d.count })) ?? [];
  const statusData = stats?.statusDistribution.map((d, i) => ({
    label: getStatusStudentLabel(d.status),
    value: d.count,
    color: STATUS_COLORS[i % STATUS_COLORS.length],
  })) ?? [];
  const totalAppointmentCount = stats?.statusDistribution.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const waitlistCount = stats?.statusDistribution.find((item) =>
    ['WAITING', 'WAITLIST'].includes(item.status),
  )?.count ?? 0;

  return (
    <div className="w-full min-w-0 animate-fade-in pb-12">
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
                  to: appointmentListPath({ status: 'PENDING' }),
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

      {stats || summary ? (
        <section className="mb-5" aria-label="Randevu istatistikleri">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">event</span>
            <h2 className="font-headline-md text-headline-md text-on-background">Randevu İstatistikleri</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {stats ? (
              <>
                <DashboardKpiCard
                  icon="event_note"
                  label="Toplam Randevu"
                  value={totalAppointmentCount}
                  onClick={() => navigate(appointmentListPath({ status: 'ALL' }))}
                />
                <DashboardKpiCard
                  icon="pending"
                  label="Bekleyen"
                  value={getStatusCount(stats, 'PENDING')}
                  onClick={() => navigate(appointmentListPath({ status: 'PENDING' }))}
                />
                <DashboardKpiCard
                  icon="task_alt"
                  label="Onaylanan"
                  value={getStatusCount(stats, 'APPROVED')}
                  onClick={() => navigate(appointmentListPath({ status: 'APPROVED' }))}
                />
                <DashboardKpiCard
                  icon="check_circle"
                  label="Tamamlanan"
                  value={getStatusCount(stats, 'COMPLETED')}
                  onClick={() => navigate(appointmentListPath({ status: 'COMPLETED' }))}
                />
                <DashboardKpiCard
                  icon="person_cancel"
                  label="Katılmayan"
                  value={getStatusCount(stats, 'NO_SHOW')}
                  onClick={() => navigate(appointmentListPath({ status: 'NO_SHOW' }))}
                />
              </>
            ) : null}
            {waitlistCount > 0 && stats ? (
              <DashboardKpiCard
                icon="group_add"
                label="Bekleme Listesi"
                value={waitlistCount}
                onClick={() => navigate(appointmentListPath({ status: 'ALL' }))}
              />
            ) : null}
            {summary ? (
              <>
                <DashboardKpiCard
                  icon="hourglass_top"
                  label="Bekleyen Devir"
                  value={summary.pendingDelegationCount}
                  onClick={() => navigate(academicianDelegationHistoryPath('PENDING'))}
                />
                <DashboardKpiCard
                  icon="check_circle"
                  label="Kabul Edilen Devir"
                  value={summary.acceptedDelegationCount}
                  onClick={() => navigate(academicianDelegationHistoryPath('ACCEPTED'))}
                />
                <DashboardKpiCard
                  icon="cancel"
                  label="Reddedilen Devir"
                  value={summary.rejectedDelegationCount}
                  onClick={() => navigate(academicianDelegationHistoryPath('REJECTED'))}
                />
              </>
            ) : null}
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
          calendarPath={ROUTES.ACADEMICIAN_CALENDAR}
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
          appointmentsPath={appointmentListPath({ status: 'PENDING' })}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DashboardEntityListCard
          title="Derslerim"
          items={courseItems}
          loading={listsLoading}
          emptyMessage="Aktif dersiniz bulunmuyor."
          emptyIcon="menu_book"
          actionLabel="Tüm Dersleri Gör"
          actionPath={ROUTES.ACADEMICIAN_COURSES}
        />
        <DashboardEntityListCard
          title="Araştırma Görevlilerim"
          items={assistantItems}
          loading={listsLoading}
          emptyMessage="Atanmış araştırma görevliniz bulunmuyor."
          emptyIcon="group"
          actionLabel="Tüm Araştırma Görevlilerini Gör"
          actionPath={ROUTES.ACADEMICIAN_COURSES}
        />
      </div>

      {stats && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">analytics</span>
            <h2 className="font-headline-md text-headline-md text-primary">Kişisel İstatistiklerim</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">show_chart</span>
                <h3 className="font-title-md text-title-md text-on-surface">Son 7 Gün</h3>
              </div>
              <div className="mt-auto">
                <LineChart
                  data={weeklyData}
                  onClick={(label) => navigate(appointmentListPath({ date: label }))}
                />
              </div>
            </div>

            <div className="flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">donut_large</span>
                <h3 className="font-title-md text-title-md text-on-surface">Durum Dağılımı</h3>
              </div>
              <div className="mt-auto">
                <DoughnutChart
                  data={statusData}
                  onClick={(label) => {
                    const status = stats.statusDistribution.find(
                      (item) => getStatusStudentLabel(item.status) === label,
                    )?.status;
                    if (status) {
                      navigate(appointmentListPath({
                        status: getAppointmentStatusFilter(status),
                      }));
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">category</span>
                <h3 className="font-title-md text-title-md text-on-surface">Kategoriler</h3>
              </div>
              <div className="mt-auto">
                <BarChart
                  data={categoryData}
                  onClick={(label) => navigate(appointmentListPath({ category: label }))}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
