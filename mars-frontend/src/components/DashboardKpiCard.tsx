type DashboardKpiCardProps = {
  icon: string;
  label: string;
  value: number;
  onClick: () => void;
};

export default function DashboardKpiCard({
  icon,
  label,
  value,
  onClick,
}: DashboardKpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-20 min-w-0 items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-surface-container/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/40 active:scale-[0.98]"
      aria-label={`${label}: ${value}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary-container">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          {icon}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block line-clamp-2 font-label-sm text-label-sm text-on-surface-variant">
          {label}
        </span>
        <span className="mt-0.5 block font-headline-sm text-headline-sm font-bold text-on-background">
          {value}
        </span>
      </span>
    </button>
  );
}
