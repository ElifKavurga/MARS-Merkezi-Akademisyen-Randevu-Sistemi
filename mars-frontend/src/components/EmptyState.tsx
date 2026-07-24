

export default function EmptyState({
  icon = 'inbox',
  title = 'Veri Bulunamadı',
  message,
}: {
  icon?: string;
  title?: string;
  message: string;
}) {
  return (
    <div className="w-full min-w-0 animate-fade-in flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center shadow-sm">
      <span className="material-symbols-outlined mb-3 text-5xl text-on-surface-variant/50" aria-hidden="true">
        {icon}
      </span>
      <p className="font-title-lg text-title-lg text-on-surface">{title}</p>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant max-w-lg">
        {message}
      </p>
    </div>
  );
}
