import { useCallback, useEffect, useState } from 'react';
import DashboardDailySchedule from '../components/DashboardDailySchedule';
import DashboardDelegationStats from '../components/DashboardDelegationStats';
import DashboardEntityListCard from '../components/DashboardEntityListCard';
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
import { getAcademicianDashboardSummary } from '../services/academicianDashboardService';
import { getCourseAssistants, getMyCourses } from '../services/courseService';
import type { CourseAssistant } from '../types/course';
import type { AcademicianDashboardSummary } from '../types/dashboard';
import type { NotificationItem } from '../types/notification';

const PREVIEW_LIMIT = 5;
const isDashboardNotification = (notification: NotificationItem) =>
  notification.relatedAppointmentId != null || notification.relatedDelegationId != null;

export default function AcademicianDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const dailySchedule = useDashboardDailySchedule();
  const retryDailySchedule = dailySchedule.retry;
  const [summary, setSummary] = useState<AcademicianDashboardSummary | null>(null);
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
      setSummary(await getAcademicianDashboardSummary());
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

      <DashboardDelegationStats
        loading={loading}
        cards={
          summary
            ? [
                {
                  label: 'Bekleyen Delegasyonlar',
                  value: summary.pendingDelegationCount,
                  to: academicianDelegationHistoryPath('PENDING'),
                  icon: 'hourglass_top',
                },
                {
                  label: 'Kabul Edilen Delegasyonlar',
                  value: summary.acceptedDelegationCount,
                  to: academicianDelegationHistoryPath('ACCEPTED'),
                  icon: 'check_circle',
                },
                {
                  label: 'Reddedilen Delegasyonlar',
                  value: summary.rejectedDelegationCount,
                  to: academicianDelegationHistoryPath('REJECTED'),
                  icon: 'cancel',
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
          appointmentsPath={ROUTES.ACADEMICIAN_APPOINTMENTS}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          title="Asistanlarım"
          items={assistantItems}
          loading={listsLoading}
          emptyMessage="Atanmış asistanınız bulunmuyor."
          emptyIcon="group"
          actionLabel="Tüm Asistanları Gör"
          actionPath={ROUTES.ACADEMICIAN_COURSES}
        />
      </div>
    </div>
  );
}
