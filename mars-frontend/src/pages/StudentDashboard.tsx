import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentLoadingState from '../components/StudentLoadingState';
import { STUDENT_UI } from '../constants/studentUi';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useNotificationRealtimeRefresh } from '../hooks/useNotificationRealtimeRefresh';
import {
  getStudentActiveAppointments,
  getStudentPenaltyStatus,
} from '../services/studentAppointmentService';
import { getPendingStudentDelegations } from '../services/delegationService';
import type { NotificationItem } from '../types/notification';
import type { StudentPenaltyStatus } from '../types/appointment';
import { formatStudentAppointmentDate, formatStudentAppointmentTime } from '../utils/studentAppointmentFormat';

const isAppointmentNotification = (notification: NotificationItem) =>
  notification.relatedAppointmentId != null;
const isStudentDelegationNotification = (notification: NotificationItem) =>
  notification.notificationType === 'STUDENT_APPROVAL_PENDING';

type PlaceholderCardProps = {
  title: string;
  icon: string;
  emptyTitle: string;
  emptyMessage: string;
  loading: boolean;
  loadingLabel: string;
};

function PlaceholderCard({
  title,
  icon,
  emptyTitle,
  emptyMessage,
  loading,
  loadingLabel,
}: PlaceholderCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center gap-3 p-5 sm:p-6">
        <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden="true">
          {icon}
        </span>
        <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
      </div>
      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        {loading ? (
          <StudentLoadingState label={loadingLabel} compact />
        ) : (
          <StudentEmptyState
            icon={icon}
            title={emptyTitle}
            description={emptyMessage}
            className="border-0 bg-surface px-4 py-8"
          />
        )}
      </div>
    </section>
  );
}

function formatPenaltyDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function PenaltyStatusCard({
  status,
  loading,
}: {
  status: StudentPenaltyStatus | null;
  loading: boolean;
}) {
  const active = status?.penaltyActive === true;

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`material-symbols-outlined text-[22px] ${
              active ? 'text-error' : 'text-primary'
            }`}
            aria-hidden="true"
          >
            gavel
          </span>
          <h2 className="font-headline-md text-headline-md text-primary">
            {STUDENT_UI.PENALTY_TITLE}
          </h2>
        </div>
        {status ? (
          <span
            className={`rounded-full px-2.5 py-1 font-label-sm text-label-sm ${
              active
                ? 'bg-error-container text-error'
                : 'bg-primary-fixed text-on-primary-fixed'
            }`}
          >
            {active ? 'Aktif' : `${status.totalNoShowCount}/${status.maxNoShowCount}`}
          </span>
        ) : null}
      </div>
      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        {loading ? (
          <StudentLoadingState label={STUDENT_UI.PENALTY_LOADING} compact />
        ) : !status ? (
          <StudentEmptyState
            icon="gavel"
            title={STUDENT_UI.PENALTY_EMPTY_TITLE}
            description={STUDENT_UI.PENALTY_EMPTY_DESCRIPTION}
            className="border-0 bg-surface px-4 py-8"
          />
        ) : active ? (
          <div className="space-y-3 rounded-lg border border-error/30 bg-error-container/30 p-4">
            <p className="font-body-md text-body-md font-semibold text-error">
              Yeni randevu oluşturmanız geçici olarak kısıtlandı.
            </p>
            {typeof status.remainingDays === 'number' ? (
              <p className="font-body-md text-body-md text-on-surface">
                {status.remainingDays > 0
                  ? `${status.remainingDays} gün sonra tekrar randevu oluşturabilirsiniz.`
                  : 'Ceza süreniz bugün sona ermektedir.'}
              </p>
            ) : null}
            <dl className="space-y-2">
              {status.restrictionEndDate ? (
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="font-label-sm text-label-sm text-on-surface-variant">
                    Ceza bitiş tarihi
                  </dt>
                  <dd className="font-body-md text-body-md text-on-surface">
                    {formatPenaltyDate(status.restrictionEndDate)}
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="font-label-sm text-label-sm text-on-surface-variant">
                  Ceza süresi
                </dt>
                <dd className="font-body-md text-body-md text-on-surface">
                  {status.penaltyDurationDays} gün
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <p className="font-body-md text-body-md text-on-surface">
              Aktif cezanız bulunmuyor.
            </p>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Randevuya katılmama sayınız: {status.totalNoShowCount}/{status.maxNoShowCount}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const appointmentsQuery = useQuery({
    queryKey: ['student-dashboard-appointments', user?.userId],
    queryFn: getStudentActiveAppointments,
    enabled: user != null,
  });
  const appointments = appointmentsQuery.data ?? [];
  const delegationsQuery = useQuery({
    queryKey: ['student-pending-delegations', user?.userId],
    queryFn: getPendingStudentDelegations,
    enabled: user != null,
  });
  const penaltyQuery = useQuery({
    queryKey: ['student-penalty-status', user?.userId],
    queryFn: getStudentPenaltyStatus,
    enabled: user != null,
  });
  const pendingDelegations = delegationsQuery.data ?? [];
  const loading = appointmentsQuery.isPending;
  useNotificationRealtimeRefresh(isAppointmentNotification, appointmentsQuery.refetch);
  useNotificationRealtimeRefresh(isStudentDelegationNotification, delegationsQuery.refetch);

  if (!user) {
    return null;
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <DashboardWelcomeBanner
        fullName={user.fullName}
        description={STUDENT_UI.DASHBOARD_SUBTITLE}
        loading={loading}
        loadingLabel={STUDENT_UI.DASHBOARD_LOADING}
        stats={[
          {
            label: 'Yaklaşan',
            value: appointments.length,
            to: ROUTES.STUDENT_APPOINTMENTS,
          },
        ]}
      />

      {pendingDelegations.length > 0 ? (
        <Link
          to={ROUTES.STUDENT_APPOINTMENTS}
          className="mb-6 flex items-center justify-between gap-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-5 no-underline shadow-sm transition hover:border-amber-400 hover:shadow-md"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="material-symbols-outlined rounded-full bg-amber-200 p-2 text-amber-900" aria-hidden>
              swap_horiz
            </span>
            <div>
              <h2 className="font-semibold text-amber-950">
                {pendingDelegations.length} randevu devri talebi onayınızı bekliyor
              </h2>
              <p className="mt-1 text-sm text-amber-800">Detayları incelemek ve karar vermek için Randevularım ekranına gidin.</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-amber-900" aria-hidden>chevron_right</span>
        </Link>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden="true">event_upcoming</span>
              <h2 className="font-headline-md text-headline-md text-primary">{STUDENT_UI.UPCOMING_TITLE}</h2>
            </div>
            {!loading && appointments.length > 0 ? <span className="rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm text-on-primary-fixed">{appointments.length}</span> : null}
          </div>
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {loading ? <StudentLoadingState label={STUDENT_UI.UPCOMING_LOADING} compact /> : appointments.length === 0 ? (
              <StudentEmptyState icon="event_upcoming" title={STUDENT_UI.UPCOMING_EMPTY_TITLE} description={STUDENT_UI.UPCOMING_EMPTY_DESCRIPTION} className="border-0 bg-surface px-4 py-8" />
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 3).map((appointment) => (
                  <Link key={appointment.appointmentId} to={`${ROUTES.STUDENT_APPOINTMENTS}/${appointment.appointmentId}`} className="block rounded-lg border border-outline-variant bg-surface p-3 no-underline transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim">
                    <span className="block truncate font-label-md text-label-md font-semibold text-on-surface">{appointment.categoryName}</span>
                    <span className="mt-1 block font-body-md text-sm text-on-surface-variant">{formatStudentAppointmentDate(appointment.appointmentDate)} · {formatStudentAppointmentTime(appointment.startTime)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
        <PlaceholderCard
          title={STUDENT_UI.WAITLIST_TITLE}
          icon="format_list_numbered"
          emptyTitle={STUDENT_UI.WAITLIST_EMPTY_TITLE}
          emptyMessage={STUDENT_UI.WAITLIST_EMPTY_DESCRIPTION}
          loading={loading}
          loadingLabel={STUDENT_UI.WAITLIST_LOADING}
        />
        <PenaltyStatusCard
          status={penaltyQuery.data ?? null}
          loading={penaltyQuery.isPending}
        />
      </div>
    </div>
  );
}
