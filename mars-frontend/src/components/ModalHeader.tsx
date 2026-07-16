type ModalHeaderProps = {
  titleId: string;
  icon: string;
  title: string;
  description: string;
};

export default function ModalHeader({ titleId, icon, title, description }: ModalHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container border border-outline-variant">
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <div>
        <h3
          className="font-headline-md text-body-lg font-bold leading-6 text-on-background"
          id={titleId}
        >
          {title}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">{description}</p>
      </div>
    </div>
  );
}
