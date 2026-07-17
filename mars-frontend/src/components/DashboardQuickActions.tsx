import { Link } from 'react-router-dom';

export type DashboardQuickAction = {
  title: string;
  icon: string;
  route: string;
  primary?: boolean;
};

export default function DashboardQuickActions({
  actions,
}: {
  actions: readonly DashboardQuickAction[];
}) {
  return (
    <section>
      <h2 className="mb-3 px-1 font-label-md text-label-md uppercase tracking-widest text-outline">
        Hızlı İşlemler
      </h2>
      <div className="space-y-3">
        {actions.map((action) => (
          <QuickActionCard key={action.route} action={action} />
        ))}
      </div>
    </section>
  );
}

function QuickActionCard({ action }: { action: DashboardQuickAction }) {
  return (
    <Link
      to={action.route}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 no-underline transition-colors hover:no-underline focus:no-underline active:no-underline visited:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2 ${
        action.primary
          ? 'border-primary-container bg-primary-container text-on-primary hover:opacity-90'
          : 'border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high'
      }`}
      style={{ textDecoration: 'none' }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className="material-symbols-outlined shrink-0 no-underline"
          aria-hidden="true"
          style={{ textDecoration: 'none' }}
        >
          {action.icon}
        </span>
        <span
          className="min-w-0 break-words font-body-md text-body-md font-semibold no-underline"
          style={{ textDecoration: 'none' }}
        >
          {action.title}
        </span>
      </span>
      <span
        className="material-symbols-outlined shrink-0 no-underline"
        aria-hidden="true"
        style={{ textDecoration: 'none' }}
      >
        chevron_right
      </span>
    </Link>
  );
}
