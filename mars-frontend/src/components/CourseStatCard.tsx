type CourseStatCardProps = {
  label: string;
  value: string | number;
  icon: string;
};

export default function CourseStatCard({ label, value, icon }: CourseStatCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:p-5 flex items-start gap-3 transition-colors hover:bg-surface-container/40">
      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shrink-0">
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        <p className="mt-1 font-body-md text-body-md text-on-background break-words">{value}</p>
      </div>
    </div>
  );
}
