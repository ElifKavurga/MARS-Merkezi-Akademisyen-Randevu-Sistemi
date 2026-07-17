export default function DashboardEmptyState({
  icon,
  message,
}: {
  icon: string;
  message: string;
}) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-lg bg-surface px-4 py-8 text-center">
      <span
        className="material-symbols-outlined text-[36px] text-on-surface-variant/50"
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className="mt-3 font-body-md text-body-md text-on-surface-variant">{message}</p>
    </div>
  );
}
