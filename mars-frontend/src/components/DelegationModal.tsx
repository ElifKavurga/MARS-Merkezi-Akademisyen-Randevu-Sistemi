import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  DELEGATION_MESSAGES,
  formatCourseLabel,
} from '../constants/delegation';
import { FORM_SELECT_CLASS } from '../constants/ui';
import { getCourseAssistants } from '../services/courseService';
import { createDelegation } from '../services/delegationService';
import type { StaffAppointment } from '../types/appointment';
import type { CourseAssistant } from '../types/course';
import Loading from './Loading';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';

type DelegationModalProps = {
  appointment: StaffAppointment | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

function getBackendErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) {
    return fallback;
  }
  const backendMessage = err.response?.data?.message;
  if (typeof backendMessage === 'string' && backendMessage.length > 0) {
    return backendMessage;
  }
  return fallback;
}

export default function DelegationModal({
  appointment,
  onClose,
  onSuccess,
}: DelegationModalProps) {
  const [assistants, setAssistants] = useState<CourseAssistant[]>([]);
  const [assistantId, setAssistantId] = useState<number>(0);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = appointment !== null;
  const courseId = appointment?.courseId ?? null;

  useEffect(() => {
    if (!open || courseId == null) {
      return;
    }

    let cancelled = false;
    setAssistantId(0);
    setError(null);
    setLoadingOptions(true);

    void (async () => {
      try {
        const data = await getCourseAssistants(courseId);
        if (cancelled) {
          return;
        }
        setAssistants(data);
        if (data.length === 1) {
          setAssistantId(data[0].assistantId);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(getBackendErrorMessage(err, DELEGATION_MESSAGES.ASSISTANTS_LOAD_ERROR));
        setAssistants([]);
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, courseId, appointment?.appointmentId]);

  if (!appointment) {
    return null;
  }

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setAssistantId(0);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError(null);

    if (!assistantId) {
      setError(DELEGATION_MESSAGES.ASSISTANT_REQUIRED);
      return;
    }

    setSubmitting(true);
    try {
      await createDelegation({
        appointmentId: appointment.appointmentId,
        assistantId,
      });
      setAssistantId(0);
      setError(null);
      onSuccess(DELEGATION_MESSAGES.SUCCESS);
      onClose();
    } catch (err) {
      setError(getBackendErrorMessage(err, DELEGATION_MESSAGES.ERROR));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAssistant = assistants.find((item) => item.assistantId === assistantId);
  const courseLabel = formatCourseLabel(appointment);

  return (
    <ModalShell
      open={open}
      titleId="delegation-modal-title"
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      disableBackdropClose={submitting}
      zIndexClass="z-[60]"
      footer={
        <ModalFormFooter
          submitting={submitting}
          onCancel={handleClose}
          submitLabel={DELEGATION_MESSAGES.CONFIRM_LABEL}
        />
      }
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="delegation-modal-title"
          icon="swap_horiz"
          title={DELEGATION_MESSAGES.MODAL_TITLE}
          description={DELEGATION_MESSAGES.MODAL_DESCRIPTION}
        />

        <dl className="mt-4 space-y-3">
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
            <dt className="font-label-sm text-label-sm text-on-surface-variant">
              {DELEGATION_MESSAGES.COURSE_LABEL}
            </dt>
            <dd className="mt-1 font-body-md text-body-md font-medium text-on-background">
              {courseLabel}
            </dd>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
            <dt className="font-label-sm text-label-sm text-on-surface-variant">
              {DELEGATION_MESSAGES.SUMMARY_LABEL}
            </dt>
            <dd className="mt-1 font-body-md text-body-md text-on-background">
              {DELEGATION_MESSAGES.SUMMARY_TEXT}
            </dd>
            <dd className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
              Öğrenci: {appointment.studentName} · Kategori: {appointment.categoryName}
              {selectedAssistant
                ? ` · Asistan: ${selectedAssistant.assistantName}`
                : ''}
            </dd>
          </div>
        </dl>

        <div className="mt-4 space-y-1.5 text-left">
          <label
            htmlFor="delegationAssistantId"
            className="block font-label-md text-label-md text-on-surface-variant"
          >
            {DELEGATION_MESSAGES.ASSISTANT_LABEL}
          </label>
          {loadingOptions ? (
            <Loading variant="inline" label={DELEGATION_MESSAGES.LOADING_ASSISTANTS} />
          ) : assistants.length === 1 ? (
            <p className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-background">
              {assistants[0].assistantName}
              <span className="mt-1 block font-label-sm text-label-sm text-on-surface-variant">
                {DELEGATION_MESSAGES.SINGLE_ASSISTANT_HINT}
              </span>
            </p>
          ) : (
            <select
              id="delegationAssistantId"
              className={FORM_SELECT_CLASS}
              required
              disabled={submitting || assistants.length === 0}
              value={assistantId || ''}
              onChange={(event) => setAssistantId(Number(event.target.value))}
              aria-label={DELEGATION_MESSAGES.ASSISTANT_LABEL}
            >
              <option value="">{DELEGATION_MESSAGES.SELECT_ASSISTANT}</option>
              {assistants.map((assistant) => (
                <option key={assistant.assistantId} value={assistant.assistantId}>
                  {assistant.assistantName} — {assistant.institutionalEmail}
                </option>
              ))}
            </select>
          )}
          {!loadingOptions && assistants.length === 0 && !error ? (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {DELEGATION_MESSAGES.NO_ASSISTANTS}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 font-label-sm text-label-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </ModalShell>
  );
}
