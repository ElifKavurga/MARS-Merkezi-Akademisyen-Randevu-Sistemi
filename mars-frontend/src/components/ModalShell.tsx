import type { FormEvent, ReactNode } from 'react';

type ModalShellProps = {
  open: boolean;
  titleId: string;
  accentClass?: string;
  onClose: () => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  disableBackdropClose?: boolean;
  maxWidthClass?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function ModalShell({
  open,
  titleId,
  accentClass = 'bg-primary-container',
  onClose,
  onSubmit,
  disableBackdropClose = false,
  maxWidthClass = 'sm:max-w-lg',
  children,
  footer,
}: ModalShellProps) {
  if (!open) {
    return null;
  }

  const panel = (
    <>
      <div className={`h-1.5 w-full ${accentClass}`} />
      {children}
      {footer}
    </>
  );

  return (
    <div aria-labelledby={titleId} aria-modal="true" className="fixed inset-0 z-50" role="dialog">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-primary/20 backdrop-blur-sm transition-opacity"
        onClick={disableBackdropClose ? undefined : onClose}
      />
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className={`relative transform overflow-hidden rounded-xl bg-surface text-left shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all sm:my-8 sm:w-full ${maxWidthClass} border border-outline-variant`}
          >
            {onSubmit ? <form onSubmit={onSubmit}>{panel}</form> : panel}
          </div>
        </div>
      </div>
    </div>
  );
}
