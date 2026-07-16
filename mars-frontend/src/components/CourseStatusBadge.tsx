type CourseStatusBadgeProps = {
  isActive: boolean;
};

export default function CourseStatusBadge({ isActive }: CourseStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-label-sm text-label-sm ${
        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {isActive ? 'Aktif' : 'Pasif'}
    </span>
  );
}
