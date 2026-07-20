import {
  STUDENT_APPOINTMENT_ACTIVE_STEP_INDEX,
  STUDENT_APPOINTMENT_MESSAGES,
  STUDENT_APPOINTMENT_STEPS,
} from '../constants/studentAppointment';

type StudentAppointmentStepperProps = {
  activeStepIndex?: number;
};

export default function StudentAppointmentStepper({
  activeStepIndex = STUDENT_APPOINTMENT_ACTIVE_STEP_INDEX,
}: StudentAppointmentStepperProps) {
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
            const isCompleted = index < activeStepIndex;
            const isLocked = index > activeStepIndex;

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
                  title={isLocked ? STUDENT_APPOINTMENT_MESSAGES.STEP_LOCKED : undefined}
                >
                  {index + 1}
                </span>
                <span
                  className={`max-w-full truncate px-1 font-label-sm text-label-sm ${
                    isActive
                      ? 'font-semibold text-primary'
                      : isLocked
                        ? 'text-on-surface-variant/60'
                        : 'text-on-surface-variant'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
