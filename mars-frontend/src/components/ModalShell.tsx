import {
  useEffect,
  useRef,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

type ModalShellProps = {
  open: boolean;
  titleId: string;
  accentClass?: string;
  onClose: () => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  disableBackdropClose?: boolean;
  maxWidthClass?: string;
  zIndexClass?: string;
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
  zIndexClass = 'z-50',
  children,
  footer,
}: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const disableBackdropCloseRef = useRef(disableBackdropClose);

  onCloseRef.current = onClose;
  disableBackdropCloseRef.current = disableBackdropClose;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusFirst = () => {
      const root = panelRef.current;
      if (!root) {
        return;
      }
      const focusable = root.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    };

    const frame = window.requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disableBackdropCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

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

  const stopPropagation = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className={`fixed inset-0 ${zIndexClass}`}
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-primary/20 backdrop-blur-sm transition-opacity"
        onClick={disableBackdropClose ? undefined : onClose}
      />
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            ref={panelRef}
            className={`relative transform overflow-hidden rounded-xl bg-surface text-left shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all sm:my-8 sm:w-full ${maxWidthClass} border border-outline-variant`}
            onClick={stopPropagation}
          >
            {onSubmit ? <form onSubmit={onSubmit}>{panel}</form> : panel}
          </div>
        </div>
      </div>
    </div>
  );
}
