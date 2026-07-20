type StudentAcceptingBadgeProps = {
  accepting: boolean;
  activeLabel: string;
  inactiveLabel: string;
};

export default function StudentAcceptingBadge({
  accepting,
  activeLabel,
  inactiveLabel,
}: StudentAcceptingBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 font-label-sm text-label-sm ${
        accepting ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${accepting ? 'bg-emerald-500' : 'bg-red-500'}`}
        aria-hidden="true"
      />
      {accepting ? activeLabel : inactiveLabel}
    </span>
  );
}
