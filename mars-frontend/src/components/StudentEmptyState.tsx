type StudentEmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  className?: string;
};

export default function StudentEmptyState({
  icon,
  title,
  description,
  className = '',
}: StudentEmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-10 text-center ${className}`.trim()}
    >
      <span
        className="material-symbols-outlined text-[42px] text-on-surface-variant/50"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h2 className="mt-3 font-headline-md text-headline-md text-on-background">{title}</h2>
      {description.trim() ? (
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{description}</p>
      ) : null}
    </div>
  );
}
