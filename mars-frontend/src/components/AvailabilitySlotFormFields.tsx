import { FORM_FIELD_CLASS } from '../constants/ui';
import { todayIsoDate } from '../constants/availability';

export type AvailabilitySlotFormValues = {
  slotDate: string;
  startTime: string;
  endTime: string;
};

type AvailabilitySlotFormFieldsProps = {
  form: AvailabilitySlotFormValues;
  disabled?: boolean;
  idPrefix: string;
  onChange: (next: AvailabilitySlotFormValues) => void;
};

export default function AvailabilitySlotFormFields({
  form,
  disabled = false,
  idPrefix,
  onChange,
}: AvailabilitySlotFormFieldsProps) {
  return (
    <div className="mt-4 space-y-4 text-left">
      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-slot-date`}
          className="block font-label-md text-label-md text-on-surface-variant"
        >
          Tarih
        </label>
        <input
          id={`${idPrefix}-slot-date`}
          type="date"
          className={FORM_FIELD_CLASS}
          required
          min={todayIsoDate()}
          value={form.slotDate}
          disabled={disabled}
          onChange={(event) => onChange({ ...form, slotDate: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-start-time`}
          className="block font-label-md text-label-md text-on-surface-variant"
        >
          Başlangıç Saati
        </label>
        <input
          id={`${idPrefix}-start-time`}
          type="time"
          className={FORM_FIELD_CLASS}
          required
          value={form.startTime}
          disabled={disabled}
          onChange={(event) => onChange({ ...form, startTime: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-end-time`}
          className="block font-label-md text-label-md text-on-surface-variant"
        >
          Bitiş Saati
        </label>
        <input
          id={`${idPrefix}-end-time`}
          type="time"
          className={FORM_FIELD_CLASS}
          required
          value={form.endTime}
          disabled={disabled}
          onChange={(event) => onChange({ ...form, endTime: event.target.value })}
        />
      </div>
    </div>
  );
}
