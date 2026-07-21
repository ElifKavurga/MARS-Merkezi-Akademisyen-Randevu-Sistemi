import { getDelegationStatusLabel } from '../constants/delegation';

const STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  PENDING_STUDENT_APPROVAL: 'bg-blue-100 text-blue-800',
  STUDENT_REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-neutral-200 text-neutral-700',
};

const STATUS_DOT_CLASSES: Record<string, string> = {
  PENDING: 'bg-amber-500',
  ACCEPTED: 'bg-emerald-500',
  REJECTED: 'bg-red-500',
  PENDING_STUDENT_APPROVAL: 'bg-blue-500',
  STUDENT_REJECTED: 'bg-red-500',
  EXPIRED: 'bg-neutral-500',
};

type DelegationStatusBadgeProps = {
  status: string;
};

export default function DelegationStatusBadge({ status }: DelegationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-label-sm text-label-sm ${
        STATUS_CLASSES[status] ?? 'bg-surface-container text-on-surface-variant'
      }`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          STATUS_DOT_CLASSES[status] ?? 'bg-on-surface-variant'
        }`}
        aria-hidden
      />
      {getDelegationStatusLabel(status)}
    </span>
  );
}
