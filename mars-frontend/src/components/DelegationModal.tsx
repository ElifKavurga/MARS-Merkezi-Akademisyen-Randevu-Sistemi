import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  DELEGATION_MESSAGES,
  formatCourseLabel,
} from '../constants/delegation';
import { FORM_SELECT_CLASS } from '../constants/ui';
import { createDelegation, getDelegationTargets } from '../services/delegationService';
import type { StaffAppointment } from '../types/appointment';
import type { DelegationTarget } from '../types/delegation';
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
  const [targets, setTargets] = useState<DelegationTarget[]>([]);
  const [targetUserId, setTargetUserId] = useState<number>(0);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = appointment !== null;
  useEffect(() => {
    if (!open || !appointment) {
      return;
    }

    let cancelled = false;
    setTargetUserId(0);
    setError(null);
    setLoadingOptions(true);

    void (async () => {
      try {
        const data = await getDelegationTargets(appointment.appointmentId);
        if (cancelled) {
          return;
        }
        setTargets(data);
        if (data.length === 1) {
          setTargetUserId(data[0].userId);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(getBackendErrorMessage(err, DELEGATION_MESSAGES.ASSISTANTS_LOAD_ERROR));
        setTargets([]);
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, appointment]);

  if (!appointment) {
    return null;
  }

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setTargetUserId(0);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError(null);

    const selectedTarget = targets.find((item) => item.userId === targetUserId);
    if (!selectedTarget) {
      setError(DELEGATION_MESSAGES.ASSISTANT_REQUIRED);
      return;
    }

    setSubmitting(true);
    try {
      await createDelegation({
        appointmentId: appointment.appointmentId,
        targetUserId: selectedTarget.userId,
        targetSlotId: selectedTarget.targetSlotId,
        targetSlotDate: selectedTarget.targetSlotDate,
        targetStartTime: selectedTarget.targetStartTime,
        targetEndTime: selectedTarget.targetEndTime,
      });
      setTargetUserId(0);
      setError(null);
      onSuccess(DELEGATION_MESSAGES.SUCCESS);
      onClose();
    } catch (err) {
      setError(getBackendErrorMessage(err, DELEGATION_MESSAGES.ERROR));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTarget = targets.find((item) => item.userId === targetUserId);
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
          submitDisabled={loadingOptions || targets.length === 0 || !targetUserId}
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
              {selectedTarget
                ? ` · Hedef: ${selectedTarget.fullName}`
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
          ) : targets.length === 1 ? (
            <p className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-background">
              {targets[0].fullName}
              <span className="mt-1 block font-label-sm text-label-sm text-on-surface-variant">
                {targets[0].requiresStudentApproval
                  ? 'Öğrenci onayı gerekli · Yanıt süresi 1 saat'
                  : DELEGATION_MESSAGES.SINGLE_ASSISTANT_HINT}
              </span>
            </p>
          ) : (
            <select
              id="delegationAssistantId"
              className={FORM_SELECT_CLASS}
              required
              disabled={submitting || targets.length === 0}
              value={targetUserId || ''}
              onChange={(event) => setTargetUserId(Number(event.target.value))}
              aria-label={DELEGATION_MESSAGES.ASSISTANT_LABEL}
            >
              <option value="">{DELEGATION_MESSAGES.SELECT_ASSISTANT}</option>
              {targets.map((target) => (
                <option key={target.userId} value={target.userId}>
                  {target.fullName} — {target.role === 'ACADEMICIAN' ? 'Akademisyen' : 'Asistan'}
                  {target.requiresStudentApproval ? ' · Öğrenci onayı gerekli' : ' · Ders asistanı'}
                </option>
              ))}
            </select>
          )}
          {selectedTarget?.requiresStudentApproval ? (
            <p className="rounded-lg border border-secondary/30 bg-secondary-container/40 px-3 py-2 font-label-sm text-label-sm text-on-secondary-container">
              Öğrencinin 1 saat içinde onayı beklenecek. Bu sürede hedef slot kilitlenecektir.
            </p>
          ) : null}
          {!loadingOptions && targets.length === 0 && !error ? (
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
