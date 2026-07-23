import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  DELEGATION_MESSAGES,
  formatCourseLabel,
} from '../constants/delegation';
import { FORM_FIELD_CLASS } from '../constants/ui';
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
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ACADEMICIAN' | 'ASSISTANT'>('ALL');
  const [search, setSearch] = useState('');
  const [description, setDescription] = useState('');
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
    setRoleFilter('ALL');
    setSearch('');
    setDescription('');
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

  const filteredTargets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr-TR');
    return targets.filter((target) => {
      if (roleFilter !== 'ALL' && target.role !== roleFilter) return false;
      if (!query) return true;
      return [target.fullName, target.institutionalEmail, target.departmentName]
        .some((value) => value?.toLocaleLowerCase('tr-TR').includes(query));
    });
  }, [roleFilter, search, targets]);

  if (!appointment) {
    return null;
  }

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setTargetUserId(0);
    setSearch('');
    setDescription('');
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
        description: description.trim() || undefined,
      });
      setTargetUserId(0);
      setDescription('');
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
      maxWidthClass="sm:max-w-2xl"
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

        <fieldset className="mt-4 space-y-3 text-left">
          <legend className="font-label-md text-label-md font-semibold text-on-surface">
            Devredilecek kişi
          </legend>
          <div className="flex flex-wrap gap-2" aria-label="Personel türü">
            {([
              ['ALL', 'Tümü'],
              ['ACADEMICIAN', 'Akademisyen'],
              ['ASSISTANT', 'Asistan'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setRoleFilter(value)}
                aria-pressed={roleFilter === value}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  roleFilter === value
                    ? 'border-primary bg-primary-container text-on-primary-container'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <label htmlFor="delegation-target-search" className="sr-only">Kişi ara</label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant" aria-hidden>search</span>
            <input id="delegation-target-search" type="search" className={`${FORM_FIELD_CLASS} pl-10`}
              value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Ad, e-posta veya bölüm ile ara" disabled={submitting || loadingOptions} />
          </div>
          {loadingOptions ? (
            <Loading variant="inline" label={DELEGATION_MESSAGES.LOADING_ASSISTANTS} />
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {filteredTargets.map((target) => {
                const selected = target.userId === targetUserId;
                return (
                  <label key={target.userId}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                      selected ? 'border-primary bg-primary-container/40' : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container/50'
                    }`}>
                    <input type="radio" name="delegationTarget" value={target.userId}
                      checked={selected} disabled={submitting}
                      onChange={() => setTargetUserId(target.userId)}
                      className="mt-1 size-4 accent-primary" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-on-surface">
                        {target.fullName}
                        <span className="ml-2 rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                          {target.role === 'ACADEMICIAN' ? 'Akademisyen' : 'Asistan'}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-on-surface-variant">
                        {target.institutionalEmail}{target.departmentName ? ` · ${target.departmentName}` : ''}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-on-surface-variant">
                        {target.requiresStudentApproval ? 'Öğrenci onayı gerekli' : 'Ders asistanı'}
                      </span>
                    </span>
                  </label>
                );
              })}
              {filteredTargets.length === 0 ? (
                <p className="rounded-lg bg-surface-container px-3 py-4 text-center text-sm text-on-surface-variant">
                  Aramanıza uygun kişi bulunamadı.
                </p>
              ) : null}
            </div>
          )}
          {selectedTarget?.requiresStudentApproval ? (
            <p className="rounded-lg border border-secondary/30 bg-secondary-container/40 px-3 py-2 font-label-sm text-label-sm text-on-secondary-container">
              Öğrencinin 2 saat içinde onayı beklenecek. Bu sürede hedef slot kilitlenecektir.
            </p>
          ) : null}
          {!loadingOptions && targets.length === 0 && !error ? (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {DELEGATION_MESSAGES.NO_ASSISTANTS}
            </p>
          ) : null}
        </fieldset>

        <div className="mt-4 space-y-1.5 text-left">
          <label htmlFor="delegation-description" className="block font-label-md text-label-md text-on-surface-variant">
            Açıklama <span className="font-normal">(isteğe bağlı)</span>
          </label>
          <textarea id="delegation-description" className={`${FORM_FIELD_CLASS} min-h-24 resize-y`}
            maxLength={500} value={description} disabled={submitting}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Devralacak kişiye iletmek istediğiniz kısa notu yazın." />
          <p className="text-right text-xs text-on-surface-variant">{description.length}/500</p>
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
