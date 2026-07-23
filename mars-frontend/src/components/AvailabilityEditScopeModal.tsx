import { useEffect, useState } from 'react';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';

type EditScope = 'single' | 'series';

type AvailabilityEditScopeModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (scope: EditScope) => void;
};

const OPTIONS: Array<{ value: EditScope; label: string }> = [
  { value: 'single', label: 'Yalnızca bu ofis saatini düzenle' },
  { value: 'series', label: 'Tekrarlayan ofis saatlerinin tamamını düzenle' },
];

export default function AvailabilityEditScopeModal({
  open,
  onClose,
  onSelect,
}: AvailabilityEditScopeModalProps) {
  const [scope, setScope] = useState<EditScope>('single');

  useEffect(() => {
    if (open) {
      setScope('single');
    }
  }, [open]);

  return (
    <ModalShell
      open={open}
      titleId="availability-edit-scope-title"
      onClose={onClose}
      maxWidthClass="sm:max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-2 border-t border-outline-variant bg-surface-bright px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            className="inline-flex justify-center rounded-lg border border-outline-variant bg-surface px-5 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
            onClick={onClose}
          >
            İptal
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
            onClick={() => onSelect(scope)}
          >
            Devam Et
          </button>
        </div>
      }
    >
      <div className="bg-surface px-4 pb-5 pt-5 sm:p-6">
        <ModalHeader
          titleId="availability-edit-scope-title"
          icon="edit_calendar"
          title="Ofis Saatini Düzenle"
          description="Yapacağınız değişikliğin kapsamını seçin."
        />

        <fieldset className="mt-5 space-y-3">
          <legend className="sr-only">Düzenleme kapsamı</legend>
          {OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                scope === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
              }`}
            >
              <input
                type="radio"
                name="availability-edit-scope"
                value={option.value}
                checked={scope === option.value}
                onChange={() => setScope(option.value)}
                className="h-4 w-4 accent-primary"
              />
              <span className="font-body-md text-body-md text-on-surface">{option.label}</span>
            </label>
          ))}
        </fieldset>
      </div>
    </ModalShell>
  );
}
