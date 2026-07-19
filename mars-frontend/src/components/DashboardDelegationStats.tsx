import { Link } from 'react-router-dom';
import Loading from './Loading';

export type DashboardDelegationStatCard = {
  label: string;
  value: number;
  to: string;
  icon: string;
};

type DashboardDelegationStatsProps = {
  title?: string;
  cards: readonly DashboardDelegationStatCard[];
  loading?: boolean;
};

export default function DashboardDelegationStats({
  title = 'Delegasyon Özeti',
  cards,
  loading = false,
}: DashboardDelegationStatsProps) {
  if (!loading && cards.length === 0) {
    return null;
  }

  return (
    <section className="mb-6" aria-label={title}>
      <h2 className="mb-3 font-headline-md text-headline-md text-on-background">{title}</h2>
      {loading ? (
        <div className="flex justify-center rounded-xl border border-outline-variant bg-surface-container-lowest py-10">
          <Loading label="Delegasyon özeti yükleniyor..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 no-underline transition-colors hover:bg-surface-container/40 hover:no-underline focus:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/40 sm:p-5"
              style={{ textDecoration: 'none' }}
              aria-label={`${card.label}: ${card.value}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary-container">
                <span className="material-symbols-outlined" aria-hidden="true">
                  {card.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-label-sm text-label-sm text-on-surface-variant">{card.label}</p>
                <p className="mt-1 font-headline-md text-headline-md font-bold text-on-background">
                  {card.value}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
