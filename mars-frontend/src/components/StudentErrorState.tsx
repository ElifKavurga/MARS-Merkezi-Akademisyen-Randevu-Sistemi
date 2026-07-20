import { Link } from 'react-router-dom';
import { STUDENT_UI } from '../constants/studentUi';

type StudentErrorStateProps = {
  message: string;
  onRetry?: () => void;
  secondaryAction?: {
    label: string;
    to: string;
  };
};

export default function StudentErrorState({
  message,
  onRetry,
  secondaryAction,
}: StudentErrorStateProps) {
  return (
    <div className="rounded-xl border border-error/30 bg-error-container/40 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="font-body-md text-body-md text-on-error-container" role="alert">
          {message}
        </p>
        <div className="flex flex-wrap gap-2">
          {onRetry ? (
            <button type="button" className={STUDENT_UI.PRIMARY_BUTTON_CLASS} onClick={onRetry}>
              {STUDENT_UI.RETRY}
            </button>
          ) : null}
          {secondaryAction ? (
            <Link
              to={secondaryAction.to}
              className={STUDENT_UI.SECONDARY_BUTTON_CLASS}
              style={{ textDecoration: 'none' }}
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
