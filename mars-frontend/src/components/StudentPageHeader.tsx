import type { ReactNode } from 'react';

type StudentPageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export default function StudentPageHeader({
  title,
  description: _description,
  actions,
}: StudentPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-headline-lg text-headline-lg text-on-background">{title}</h1>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
