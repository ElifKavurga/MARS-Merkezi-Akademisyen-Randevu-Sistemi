import {
  STUDENT_APPOINTMENT_ACTIVE_STEP_INDEX,
  STUDENT_APPOINTMENT_MESSAGES,
  STUDENT_APPOINTMENT_STEPS,
} from '../constants/studentAppointment';

type StudentAppointmentStepperProps = {
  activeStepIndex?: number;
  /** Tamamlanmış / atlanmış adımlar (ör. ders gerektirmeyen kategoride Ders). */
  skippedStepIndices?: readonly number[];
};

function stepStatusLabel(options: {
  isActive: boolean;
  isSkipped: boolean;
  isCompleted: boolean;
  isLocked: boolean;
}): string {
  if (options.isActive) {
    return STUDENT_APPOINTMENT_MESSAGES.STEP_STATUS_CURRENT;
  }
  if (options.isSkipped) {
    return STUDENT_APPOINTMENT_MESSAGES.STEP_STATUS_SKIPPED;
  }
  if (options.isCompleted) {
    return STUDENT_APPOINTMENT_MESSAGES.STEP_STATUS_COMPLETED;
  }
  if (options.isLocked) {
    return STUDENT_APPOINTMENT_MESSAGES.STEP_STATUS_LOCKED;
  }
  return STUDENT_APPOINTMENT_MESSAGES.STEP_STATUS_LOCKED;
}

export default function StudentAppointmentStepper({
  activeStepIndex = STUDENT_APPOINTMENT_ACTIVE_STEP_INDEX,
  skippedStepIndices = [],
}: StudentAppointmentStepperProps) {
  const skipped = new Set(skippedStepIndices);
  const progressPercent =
    STUDENT_APPOINTMENT_STEPS.length <= 1
      ? 0
      : (activeStepIndex / (STUDENT_APPOINTMENT_STEPS.length - 1)) * 100;

  return (
    <nav aria-label="Randevu oluşturma adımları" className="mb-8">
      <div className="relative mx-auto max-w-3xl">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-5 h-0.5 bg-surface-container"
        />
        <div
          aria-hidden="true"
          className="absolute left-0 top-5 h-0.5 bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
        <ol className="relative flex items-start justify-between gap-1">
          {STUDENT_APPOINTMENT_STEPS.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isSkipped = skipped.has(index) && index < activeStepIndex;
            const isCompleted = index < activeStepIndex || isSkipped;
            const isLocked = index > activeStepIndex;
            const status = stepStatusLabel({
              isActive,
              isSkipped,
              isCompleted,
              isLocked,
            });

            return (
              <li
                key={step.id}
                className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-label-md text-label-md font-bold ${
                    isActive || isCompleted
                      ? 'bg-primary text-on-primary ring-4 ring-primary-fixed-dim/40'
                      : 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant'
                  }`}
                  aria-label={`${step.label}, ${status}`}
                  title={
                    isSkipped
                      ? STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_SKIPPED
                      : isLocked
                        ? STUDENT_APPOINTMENT_MESSAGES.STEP_LOCKED
                        : undefined
                  }
                >
                  {isCompleted && !isActive ? (
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      {isSkipped ? 'remove' : 'check'}
                    </span>
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                </span>
                <span
                  className={`max-w-full truncate px-1 font-label-sm text-label-sm ${
                    isActive
                      ? 'font-semibold text-primary'
                      : isLocked
                        ? 'text-on-surface-variant/60'
                        : 'text-on-surface-variant'
                  }`}
                  aria-hidden="true"
                >
                  {step.label}
                </span>
                {isSkipped ? (
                  <span
                    className="font-label-sm text-[11px] text-on-surface-variant/70"
                    aria-hidden="true"
                  >
                    {STUDENT_APPOINTMENT_MESSAGES.STEP_COURSE_SKIPPED}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
