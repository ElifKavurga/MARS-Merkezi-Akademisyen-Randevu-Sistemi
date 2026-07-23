import { getDelegationStatusLabel } from '../constants/delegation';

const STATUS_CLASSES: Record<string, string> = {
  PENDING: 'border border-primary/25 bg-primary-container/55 text-on-primary-container',
  PENDING_ACADEMICIAN_APPROVAL: 'border border-violet-300 bg-violet-50 text-violet-900',
  ACCEPTED: 'border border-emerald-300 bg-emerald-50 text-emerald-900',
  REJECTED: 'border border-error/25 bg-error-container/55 text-on-error-container',
  PENDING_STUDENT_APPROVAL: 'border border-blue-300 bg-blue-50 text-blue-900',
  STUDENT_REJECTED: 'border border-error/25 bg-error-container/55 text-on-error-container',
  EXPIRED: 'border border-outline-variant bg-surface-container text-on-surface',
  CANCELLED: 'border border-outline-variant bg-surface-container-high text-on-surface',
  COMPLETED: 'border border-teal-300 bg-teal-50 text-teal-900',
};

const STATUS_DOT_CLASSES: Record<string, string> = {
  PENDING: 'bg-primary',
  PENDING_ACADEMICIAN_APPROVAL: 'bg-violet-500',
  ACCEPTED: 'bg-emerald-500',
  REJECTED: 'bg-red-500',
  PENDING_STUDENT_APPROVAL: 'bg-blue-500',
  STUDENT_REJECTED: 'bg-red-500',
  EXPIRED: 'bg-neutral-500',
  CANCELLED: 'bg-slate-500',
  COMPLETED: 'bg-teal-500',
};

type DelegationStatusBadgeProps = {
  status: string;
};

export default function DelegationStatusBadge({ status }: DelegationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold ${
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
