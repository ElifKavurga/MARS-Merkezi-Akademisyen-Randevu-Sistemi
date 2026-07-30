import type { ReactNode } from 'react';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';

type WarningModalProps = {
  open: boolean;
  title: string;
  description: string;
  closeLabel?: string;
  children?: ReactNode;
  onClose: () => void;
};

export default function WarningModal({
  open,
  title,
  description,
  closeLabel = 'Tamam',
  children,
  onClose,
}: WarningModalProps) {
  return (
    <ModalShell
      open={open}
      titleId="warning-modal-title"
      accentClass="bg-tertiary"
      onClose={onClose}
      footer={
        <div className="border-t border-outline-variant bg-surface-bright px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2 sm:w-auto"
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>
      }
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="warning-modal-title"
          icon="warning"
          title={title}
          description={description}
        />
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </ModalShell>
  );
}
