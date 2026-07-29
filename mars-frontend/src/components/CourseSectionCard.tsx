import type { ReactNode } from 'react';

type CourseSectionCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function CourseSectionCard({ title, action, children }: CourseSectionCardProps) {
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
      <div className="px-4 py-3 border-b border-outline-variant flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-label-md text-label-md text-on-background">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
