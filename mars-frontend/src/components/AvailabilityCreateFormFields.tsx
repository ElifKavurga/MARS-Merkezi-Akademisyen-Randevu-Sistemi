import { FORM_FIELD_CLASS } from '../constants/ui';
import {
  APPOINTMENT_DURATION_MINUTES,
  AVAILABILITY_MESSAGES,
  OFFICE_HOUR_TYPE,
  OFFICE_WEEKDAY_OPTIONS,
  RECURRENCE_END_MODE,
  buildOfficeHourTimeOptions,
  computeAppointmentSlotCount,
  computeTotalDurationMinutes,
  formatTermEndDateLabel,
  resolveCurrentTermEndDateIso,
  todayIsoDate,
  type OfficeHourType,
  type RecurrenceEndMode,
} from '../constants/availability';

export type AvailabilityCreateFormValues = {
  slotType: OfficeHourType;
  slotDate: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  recurrenceEndMode: RecurrenceEndMode;
  recurrenceEndDate: string;
};

type AvailabilityCreateFormFieldsProps = {
  form: AvailabilityCreateFormValues;
  disabled?: boolean;
  idPrefix: string;
  onChange: (next: AvailabilityCreateFormValues) => void;
};

const TIME_OPTIONS = buildOfficeHourTimeOptions();

function TimeSelects({
  idPrefix,
  form,
  disabled,
  onChange,
}: {
  idPrefix: string;
  form: AvailabilityCreateFormValues;
  disabled: boolean;
  onChange: (next: AvailabilityCreateFormValues) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-start-time`}
          className="block font-label-md text-label-md text-on-surface-variant"
        >
          Başlangıç Saati
        </label>
        <select
          id={`${idPrefix}-start-time`}
          className={FORM_FIELD_CLASS}
          required
          value={form.startTime}
          disabled={disabled}
          onChange={(event) => onChange({ ...form, startTime: event.target.value })}
        >
          <option value="">Seçiniz</option>
          {TIME_OPTIONS.map((time) => (
            <option key={`start-${time}`} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-end-time`}
          className="block font-label-md text-label-md text-on-surface-variant"
        >
          Bitiş Saati
        </label>
        <select
          id={`${idPrefix}-end-time`}
          className={FORM_FIELD_CLASS}
          required
          value={form.endTime}
          disabled={disabled}
          onChange={(event) => onChange({ ...form, endTime: event.target.value })}
        >
          <option value="">Seçiniz</option>
          {TIME_OPTIONS.map((time) => (
            <option key={`end-${time}`} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function SlotDurationSummary({ startTime, endTime }: { startTime: string; endTime: string }) {
  const totalMinutes = computeTotalDurationMinutes(startTime, endTime);
  const appointmentCount = computeAppointmentSlotCount(startTime, endTime);
  if (totalMinutes <= 0 || appointmentCount <= 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container/40 px-3 py-3 space-y-1">
      <p className="font-label-md text-label-md text-on-background">Toplam Süre</p>
      <p className="font-body-md text-body-md text-on-background">{totalMinutes} dakika</p>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {APPOINTMENT_DURATION_MINUTES} dakikalık randevu yapısına göre
      </p>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {appointmentCount} adet randevu slotu oluşturulacaktır.
      </p>
    </div>
  );
}

export default function AvailabilityCreateFormFields({
  form,
  disabled = false,
  idPrefix,
  onChange,
}: AvailabilityCreateFormFieldsProps) {
  const isOneTime = form.slotType === OFFICE_HOUR_TYPE.ONE_TIME;
  const termEndIso = resolveCurrentTermEndDateIso();

  const toggleDay = (dayValue: number) => {
    const selected = form.daysOfWeek.includes(dayValue)
      ? form.daysOfWeek.filter((day) => day !== dayValue)
      : [...form.daysOfWeek, dayValue].sort((a, b) => a - b);
    onChange({ ...form, daysOfWeek: selected });
  };

  return (
    <div className="mt-4 space-y-5 text-left">
      <fieldset className="space-y-2">
        <legend className="font-label-md text-label-md text-on-surface-variant">Ofis Saati Türü</legend>
        <label className="flex items-start gap-2">
          <input
            type="radio"
            className="mt-1 accent-[#0b1641]"
            name={`${idPrefix}-slot-type`}
            checked={isOneTime}
            disabled={disabled}
            onChange={() => onChange({ ...form, slotType: OFFICE_HOUR_TYPE.ONE_TIME })}
          />
          <span className="font-body-md text-body-md text-on-background">
            Tek Seferlik
            <span className="block font-label-sm text-label-sm text-on-surface-variant">
              Belirli bir tarihte ek ofis saati açın.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="radio"
            className="mt-1 accent-[#0b1641]"
            name={`${idPrefix}-slot-type`}
            checked={!isOneTime}
            disabled={disabled}
            onChange={() => onChange({ ...form, slotType: OFFICE_HOUR_TYPE.RECURRING })}
          />
          <span className="font-body-md text-body-md text-on-background">
            Tekrarlayan
            <span className="block font-label-sm text-label-sm text-on-surface-variant">
              Haftalık düzenli ofis saatleri tanımlayın.
            </span>
          </span>
        </label>
      </fieldset>

      {isOneTime ? (
        <>
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
          <TimeSelects idPrefix={idPrefix} form={form} disabled={disabled} onChange={onChange} />
          <SlotDurationSummary startTime={form.startTime} endTime={form.endTime} />
        </>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="font-label-md text-label-md text-on-surface-variant">Günler</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OFFICE_WEEKDAY_OPTIONS.map((day) => {
                const checked = form.daysOfWeek.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      checked
                        ? 'border-primary-container bg-surface-container/60'
                        : 'border-outline-variant bg-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#0b1641]"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleDay(day.value)}
                    />
                    <span className="font-body-md text-body-md text-on-background">{day.label}</span>
                  </label>
                );
              })}
            </div>
            {!form.daysOfWeek.length ? (
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {AVAILABILITY_MESSAGES.DAYS_REQUIRED}
              </p>
            ) : null}
          </fieldset>

          <TimeSelects idPrefix={idPrefix} form={form} disabled={disabled} onChange={onChange} />
          <SlotDurationSummary startTime={form.startTime} endTime={form.endTime} />

          <fieldset className="space-y-3 rounded-lg border border-outline-variant px-3 py-3">
            <legend className="font-label-md text-label-md text-on-surface-variant px-1">
              Tekrar Süresi
            </legend>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Haftalık tekrar otomatik uygulanır.
            </p>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                className="mt-1 accent-[#0b1641]"
                name={`${idPrefix}-recurrence-end-mode`}
                checked={form.recurrenceEndMode === RECURRENCE_END_MODE.TERM_END}
                disabled={disabled}
                onChange={() =>
                  onChange({ ...form, recurrenceEndMode: RECURRENCE_END_MODE.TERM_END })
                }
              />
              <span className="font-body-md text-body-md text-on-background">
                Dönem sonuna kadar
                <span className="block font-label-sm text-label-sm text-on-surface-variant">
                  {formatTermEndDateLabel(termEndIso)}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                className="mt-1 accent-[#0b1641]"
                name={`${idPrefix}-recurrence-end-mode`}
                checked={form.recurrenceEndMode === RECURRENCE_END_MODE.UNTIL_DATE}
                disabled={disabled}
                onChange={() =>
                  onChange({ ...form, recurrenceEndMode: RECURRENCE_END_MODE.UNTIL_DATE })
                }
              />
              <span className="font-body-md text-body-md text-on-background">Belirli tarihe kadar</span>
            </label>

            {form.recurrenceEndMode === RECURRENCE_END_MODE.UNTIL_DATE ? (
              <div className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-recurrence-end-date`}
                  className="block font-label-md text-label-md text-on-surface-variant"
                >
                  Bitiş Tarihi
                </label>
                <input
                  id={`${idPrefix}-recurrence-end-date`}
                  type="date"
                  className={FORM_FIELD_CLASS}
                  min={todayIsoDate()}
                  value={form.recurrenceEndDate}
                  disabled={disabled}
                  onChange={(event) => onChange({ ...form, recurrenceEndDate: event.target.value })}
                />
              </div>
            ) : null}
          </fieldset>
        </>
      )}
    </div>
  );
}
