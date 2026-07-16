type AvailabilityStatusBadgeProps = {
  isBlocked: boolean;
};

export default function AvailabilityStatusBadge({ isBlocked }: AvailabilityStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 justify-center rounded-md px-2 py-0.5 font-label-sm text-label-sm ${
        isBlocked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
      }`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`}
        aria-hidden
      />
      {isBlocked ? 'Engelli' : 'Uygun'}
    </span>
  );
}
