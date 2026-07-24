import { useNavigate } from 'react-router-dom';

export default function HodPageHeader({
  title,
  description,
  backAction,
}: {
  title: string;
  description: string;
  backAction?: {
    label: string;
    to: string;
  };
}) {
  const navigate = useNavigate();

  return (
    <div className="mb-8 w-full min-w-0">
      {backAction && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(backAction.to)}
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-4 py-2 font-label-md text-label-md text-on-surface-variant shadow-sm transition-all hover:bg-surface-container-high hover:text-primary hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {backAction.label}
          </button>
        </div>
      )}
      <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
        {title}
      </h1>
      <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}
