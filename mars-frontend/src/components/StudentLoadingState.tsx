import Loading from './Loading';

type StudentLoadingStateProps = {
  label: string;
  compact?: boolean;
};

export default function StudentLoadingState({
  label,
  compact = false,
}: StudentLoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest ${
        compact ? 'min-h-32' : 'min-h-48'
      }`}
      role="status"
      aria-live="polite"
    >
      <Loading label={label} />
    </div>
  );
}
