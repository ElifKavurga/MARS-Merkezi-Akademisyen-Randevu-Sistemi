import { getAppointmentStatusLabel } from '../constants/appointment';

const STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  NO_SHOW: 'bg-slate-200 text-slate-700',
  CANCELLED: 'bg-slate-200 text-slate-700',
};

const STATUS_DOT_CLASSES: Record<string, string> = {
  PENDING: 'bg-amber-500',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-red-500',
  COMPLETED: 'bg-blue-500',
  NO_SHOW: 'bg-slate-500',
  CANCELLED: 'bg-slate-500',
};

type AppointmentStatusBadgeProps = {
  status: string;
};

export default function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
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
      {getAppointmentStatusLabel(status)}
    </span>
  );
}
