import DashboardEmptyState from '../components/DashboardEmptyState';
import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';

type PlaceholderCardProps = {
  title: string;
  icon: string;
  emptyMessage: string;
  loading: boolean;
  loadingLabel: string;
};

function PlaceholderCard({
  title,
  icon,
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
          <div className="flex min-h-32 items-center justify-center">
            <Loading label={loadingLabel} />
          </div>
        ) : (
          <DashboardEmptyState icon={icon} message={emptyMessage} />
        )}
      </div>
    </section>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  // Sprint 21.1: API entegrasyonu yok; loading iskeleti sonraki sprintlerde kullanılacak.
  const loading = false;

  if (!user) {
    return null;
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <DashboardWelcomeBanner
        fullName={user.fullName}
        description="Randevu süreçlerinizi, bekleme listelerinizi ve ceza durumunuzu buradan takip edebilirsiniz."
        loading={loading}
        loadingLabel="Ana sayfa yükleniyor..."
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
            <h2 className="font-headline-md text-headline-md text-primary">Bilgilendirme</h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Akademisyenlerden randevu almak için Akademisyen Ara menüsünü kullanabilirsiniz.
            </p>
          </div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <PlaceholderCard
          title="Yaklaşan Randevular"
          icon="event_upcoming"
          emptyMessage="Yaklaşan randevularınız burada görüntülenecek."
          loading={loading}
          loadingLabel="Yaklaşan randevular yükleniyor..."
        />
        <PlaceholderCard
          title="Bekleme Listesi"
          icon="format_list_numbered"
          emptyMessage="Bekleme listesi kayıtlarınız burada görüntülenecek."
          loading={loading}
          loadingLabel="Bekleme listesi yükleniyor..."
        />
        <PlaceholderCard
          title="Ceza Durumu"
          icon="gavel"
          emptyMessage="Ceza durumunuz burada görüntülenecek."
          loading={loading}
          loadingLabel="Ceza durumu yükleniyor..."
        />
      </div>
    </div>
  );
}
