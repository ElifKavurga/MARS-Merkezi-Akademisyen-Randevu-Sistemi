import { Link } from 'react-router-dom';

export type StudentBreadcrumbItem = {
  label: string;
  to?: string;
};

type StudentBreadcrumbProps = {
  items: readonly StudentBreadcrumbItem[];
};

export default function StudentBreadcrumb({ items }: StudentBreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Sayfa konumu" className="mb-4 font-label-sm text-label-sm text-on-surface-variant">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden="true" className="text-on-surface-variant/60">
                  ›
                </span>
              ) : null}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate text-on-surface-variant no-underline transition-colors hover:text-on-background hover:no-underline focus:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
                  style={{ textDecoration: 'none' }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`truncate ${isLast ? 'font-semibold text-on-background' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
