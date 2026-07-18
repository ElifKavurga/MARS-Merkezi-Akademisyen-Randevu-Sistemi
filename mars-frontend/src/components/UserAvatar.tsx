import { getInitials } from '../utils/userDisplay';

export default function UserAvatar({
  fullName,
  size = 'md',
  tone = 'light',
}: {
  fullName: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'light' | 'dark';
}) {
  const initials = getInitials(fullName) || '?';
  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
        ? 'h-11 w-11 text-sm'
        : 'h-10 w-10 text-sm';
  const toneClass =
    tone === 'dark'
      ? 'border-white/20 bg-white/15 text-white'
      : 'border-outline-variant bg-surface-container text-primary';

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-semibold ${sizeClass} ${toneClass}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
