import { Link } from 'react-router-dom';
import DashboardEmptyState from './DashboardEmptyState';
import DashboardSectionHeader from './DashboardSectionHeader';
import Loading from './Loading';

export type DashboardEntityListItem = {
  id: string | number;
  title: string;
  subtitle?: string;
};

type DashboardEntityListCardProps = {
  title: string;
  items: readonly DashboardEntityListItem[];
  loading?: boolean;
  emptyMessage: string;
  emptyIcon?: string;
  actionLabel: string;
  actionPath: string;
  className?: string;
};

export default function DashboardEntityListCard({
  title,
  items,
  loading = false,
  emptyMessage,
  emptyIcon = 'menu_book',
  actionLabel,
  actionPath,
  className = '',
}: DashboardEntityListCardProps) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest ${className}`}
    >
      <DashboardSectionHeader
        title={title}
        actionLabel={actionLabel}
        actionPath={actionPath}
      />
      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Loading label="Yükleniyor..." />
          </div>
        ) : items.length === 0 ? (
          <DashboardEmptyState icon={emptyIcon} message={emptyMessage} />
        ) : (
          <ul className="divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={actionPath}
                  className="flex items-center justify-between gap-3 px-4 py-3 no-underline transition-colors hover:bg-surface-bright hover:no-underline focus:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-fixed-dim"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-body-md text-body-md font-semibold text-primary">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="mt-0.5 block truncate font-label-sm text-label-sm text-on-surface-variant">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="material-symbols-outlined shrink-0 text-[18px] text-on-surface-variant"
                    aria-hidden="true"
                  >
                    chevron_right
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
