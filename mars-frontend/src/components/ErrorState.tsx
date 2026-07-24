export default function ErrorState({
  icon = 'error',
  title = 'Hata',
  message,
  onRetry,
}: {
  icon?: string;
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="rounded-xl border border-error/30 bg-error-container/10 p-8 text-center flex flex-col items-center">
        <span className="material-symbols-outlined mb-3 text-5xl text-error">{icon}</span>
        <p className="font-headline-md text-headline-md text-error">{title}</p>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant max-w-lg">{message}</p>
        
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-5 py-2.5 font-label-md text-label-md text-primary transition-all hover:bg-primary/5 hover:border-primary/40 active:bg-primary/10 shadow-sm hover:shadow"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Tekrar Dene
          </button>
        )}
      </div>
    </div>
  );
}
