import { Link } from 'react-router-dom';

export default function DashboardSectionHeader({
  title,
  actionLabel,
  actionPath,
}: {
  title: string;
  actionLabel: string;
  actionPath: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
      <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
      <Link
        to={actionPath}
        className="shrink-0 rounded font-label-md text-label-md text-primary no-underline hover:no-underline focus:no-underline active:no-underline visited:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2"
        style={{ textDecoration: 'none' }}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
