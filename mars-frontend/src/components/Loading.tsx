import { UI_LABELS } from '../constants/ui';

type LoadingProps = {
  label?: string;
  variant?: 'page' | 'block' | 'inline';
  className?: string;
};

const sizeClass: Record<NonNullable<LoadingProps['variant']>, string> = {
  page: 'h-8 w-8',
  block: 'h-6 w-6',
  inline: 'h-4 w-4',
};

export default function Loading({
  label = UI_LABELS.loading,
  variant = 'block',
  className = '',
}: LoadingProps) {
  const spinner = (
    <svg
      className={`animate-spin ${sizeClass[variant]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-2 text-current ${className}`.trim()}
        role="status"
      >
        {spinner}
        {label ? <span>{label}</span> : null}
      </span>
    );
  }

  if (variant === 'page') {
    return (
      <div
        className={`min-h-[40vh] flex flex-col items-center justify-center gap-3 text-on-surface-variant ${className}`.trim()}
        role="status"
      >
        {spinner}
        {label ? <p className="font-body-md text-body-md">{label}</p> : null}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center gap-3 p-6 text-on-surface-variant ${className}`.trim()}
      role="status"
    >
      {spinner}
      {label ? <p className="font-body-md text-body-md">{label}</p> : null}
    </div>
  );
}
