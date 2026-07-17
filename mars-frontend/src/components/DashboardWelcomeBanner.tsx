import Loading from './Loading';

export type DashboardWelcomeStat = {
  label: string;
  value: number;
};

type DashboardWelcomeBannerProps = {
  fullName: string;
  description: string;
  stats: readonly DashboardWelcomeStat[];
  loading?: boolean;
  loadingLabel?: string;
};

export default function DashboardWelcomeBanner({
  fullName,
  description,
  stats,
  loading = false,
  loadingLabel = 'Özet yükleniyor...',
}: DashboardWelcomeBannerProps) {
  return (
    <section className="relative mb-8 overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary md:p-8">
      <div className="relative z-[1] flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-headline-lg text-headline-lg">
            Hoş Geldiniz{fullName ? `, ${fullName}` : ''}
          </h1>
          <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-primary/70">
            {description}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-20 min-w-52 items-center justify-center rounded-lg bg-white/10">
            <Loading label={loadingLabel} variant="inline" />
          </div>
        ) : stats.length > 0 ? (
          <div
            className={`grid w-full gap-2 sm:w-auto sm:gap-3 ${
              stats.length === 2
                ? 'grid-cols-2'
                : stats.length === 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-3'
            }`}
          >
            {stats.map((stat) => (
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
            ))}
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent" />
    </section>
  );
}
