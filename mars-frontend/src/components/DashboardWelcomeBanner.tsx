import { Link } from 'react-router-dom';
import Loading from './Loading';

export type DashboardWelcomeStat = {
  label: string;
  value: number;
  to?: string;
};

type DashboardWelcomeBannerProps = {
  fullName: string;
  description: string;
  stats: readonly DashboardWelcomeStat[];
  showStats?: boolean;
  loading?: boolean;
  loadingLabel?: string;
};

export default function DashboardWelcomeBanner({
  fullName,
  description,
  stats,
  showStats = true,
  loading = false,
  loadingLabel = 'Ozet yukleniyor...',
}: DashboardWelcomeBannerProps) {
  const todayLabel = new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <section className="relative mb-6 overflow-hidden rounded-xl bg-primary-container p-5 text-on-primary md:p-6">
      <div className="relative z-[1] flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="max-w-3xl">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary/60">
            {todayLabel}
          </p>
          <h1 className="mt-2 font-headline-lg text-headline-lg">
            Hos Geldiniz{fullName ? `, ${fullName}` : ''}
          </h1>
          <p className="mt-1 font-body-md text-body-md text-on-primary/70">
            {description}
          </p>
        </div>

        {showStats && loading ? (
          <div className="flex min-h-20 min-w-52 items-center justify-center rounded-lg bg-white/10">
            <Loading label={loadingLabel} variant="inline" />
          </div>
        ) : showStats && stats.length > 0 ? (
          <div
            className={`grid w-full gap-2 sm:w-auto sm:gap-3 ${
              stats.length === 2
                ? 'grid-cols-2'
                : stats.length === 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-3'
            }`}
          >
            {stats.map((stat) =>
              stat.to ? (
                <Link
                  key={stat.label}
                  to={stat.to}
                  className="min-w-0 rounded-lg bg-white/10 px-2 py-3 text-center no-underline backdrop-blur-sm transition-colors hover:bg-white/20 hover:no-underline focus:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:min-w-24 sm:px-4 sm:py-4"
                  style={{ textDecoration: 'none' }}
                  aria-label={`${stat.label}: ${stat.value}`}
                >
                  <p className="min-h-8 break-words font-label-sm text-label-sm uppercase tracking-wider text-on-primary/60">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-headline-md text-headline-md font-bold text-on-primary">
                    {stat.value}
                  </p>
                </Link>
              ) : (
                <div
                  key={stat.label}
                  className="min-w-0 rounded-lg bg-white/10 px-2 py-3 text-center backdrop-blur-sm sm:min-w-24 sm:px-4 sm:py-4"
                >
                  <p className="min-h-8 break-words font-label-sm text-label-sm uppercase tracking-wider text-on-primary/60">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-headline-md text-headline-md font-bold">
                    {stat.value}
                  </p>
                </div>
              ),
            )}
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent" />
    </section>
  );
}
