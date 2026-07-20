import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import { STUDENT_UI } from '../constants/studentUi';
import { useAuth } from '../hooks/useAuth';

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

export default function StudentDashboard() {
  const { user } = useAuth();
  const loading = false;

  if (!user) {
    return null;
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <StudentPageHeader
        title={STUDENT_UI.DASHBOARD_TITLE}
        description={STUDENT_UI.DASHBOARD_SUBTITLE}
      />

      <DashboardWelcomeBanner
        fullName={user.fullName}
        description={STUDENT_UI.DASHBOARD_SUBTITLE}
        loading={loading}
        loadingLabel={STUDENT_UI.DASHBOARD_LOADING}
        stats={[]}
      />

      <section className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span
            className="material-symbols-outlined shrink-0 text-[24px] text-primary"
            aria-hidden="true"
          >
            info
          </span>
          <div className="min-w-0">
            <h2 className="font-headline-md text-headline-md text-primary">
              {STUDENT_UI.INFO_TITLE}
            </h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {STUDENT_UI.INFO_DESCRIPTION}
            </p>
          </div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <PlaceholderCard
          title={STUDENT_UI.UPCOMING_TITLE}
          icon="event_upcoming"
          emptyTitle={STUDENT_UI.UPCOMING_EMPTY_TITLE}
          emptyMessage={STUDENT_UI.UPCOMING_EMPTY_DESCRIPTION}
          loading={loading}
          loadingLabel={STUDENT_UI.UPCOMING_LOADING}
        />
        <PlaceholderCard
          title={STUDENT_UI.WAITLIST_TITLE}
          icon="format_list_numbered"
          emptyTitle={STUDENT_UI.WAITLIST_EMPTY_TITLE}
          emptyMessage={STUDENT_UI.WAITLIST_EMPTY_DESCRIPTION}
          loading={loading}
          loadingLabel={STUDENT_UI.WAITLIST_LOADING}
        />
        <PlaceholderCard
          title={STUDENT_UI.PENALTY_TITLE}
          icon="gavel"
          emptyTitle={STUDENT_UI.PENALTY_EMPTY_TITLE}
          emptyMessage={STUDENT_UI.PENALTY_EMPTY_DESCRIPTION}
          loading={loading}
          loadingLabel={STUDENT_UI.PENALTY_LOADING}
        />
      </div>
    </div>
  );
}
