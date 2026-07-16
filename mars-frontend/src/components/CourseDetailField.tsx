import type { ReactNode } from 'react';

type CourseDetailFieldProps = {
  label: string;
  children: ReactNode;
};

export default function CourseDetailField({ label, children }: CourseDetailFieldProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4 border-b border-outline-variant/40 py-3 last:border-b-0">
      <span className="font-label-md text-label-md text-on-surface-variant shrink-0">{label}</span>
      <div className="font-body-md text-body-md text-on-background sm:text-right break-words">{children}</div>
    </div>
  );
}
