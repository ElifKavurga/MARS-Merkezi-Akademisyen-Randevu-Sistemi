import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import Loading from '../components/Loading';
import { getMeetingTypeLabel } from '../constants/appointment';
import { INCOMING_DELEGATION_MESSAGES } from '../constants/delegation';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  acceptDelegation,
  getIncomingDelegations,
  rejectDelegation,
} from '../services/delegationService';
import type { DelegationResponse } from '../types/delegation';

type DecisionAction = 'accept' | 'reject';

function formatDate(date: string | null): string {
  if (!date) {
    return '-';
  }
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatTime(time: string | null): string {
  if (!time) {
    return '-';
  }
  return time.slice(0, 5);
}

function formatCourse(delegation: DelegationResponse): string {
  if (!delegation.courseName) {
    return '-';
  }
  return `${delegation.courseCode ?? ''} ${delegation.courseName}`.trim();
}

function getBackendErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) {
    return fallback;
  }
  if (err.response?.status === 403) {
    return INCOMING_DELEGATION_MESSAGES.ACCESS_DENIED;
  }
  const backendMessage = err.response?.data?.message;
  if (typeof backendMessage === 'string' && backendMessage.length > 0) {
    return backendMessage;
  }
  return fallback;
}

export default function AssistantIncomingDelegationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [delegations, setDelegations] = useState<DelegationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDelegationId, setActionDelegationId] = useState<number | null>(null);

  const loadDelegations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDelegations(await getIncomingDelegations());
    } catch (err) {
      const message = getBackendErrorMessage(
        err,
        INCOMING_DELEGATION_MESSAGES.LOAD_ERROR,
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user || user.role !== 'ASSISTANT') {
      setLoading(false);
      setError(INCOMING_DELEGATION_MESSAGES.ACCESS_DENIED);
      return;
    }

    void loadDelegations();
  }, [loadDelegations, user]);

  const handleDecision = async (
    delegationId: number,
    action: DecisionAction,
  ) => {
    if (actionDelegationId !== null) {
      return;
    }

    setActionDelegationId(delegationId);
    try {
      if (action === 'accept') {
        await acceptDelegation(delegationId);
        toast.success(INCOMING_DELEGATION_MESSAGES.ACCEPT_SUCCESS);
      } else {
        await rejectDelegation(delegationId);
        toast.success(INCOMING_DELEGATION_MESSAGES.REJECT_SUCCESS);
      }
      await queryClient.invalidateQueries({ queryKey: ['dashboard-daily-schedule'] });
      await loadDelegations();
    } catch (err) {
      toast.error(getBackendErrorMessage(err, INCOMING_DELEGATION_MESSAGES.ACTION_ERROR));
    } finally {
      setActionDelegationId(null);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          {INCOMING_DELEGATION_MESSAGES.TITLE}
        </h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          {INCOMING_DELEGATION_MESSAGES.SUBTITLE}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loading label={INCOMING_DELEGATION_MESSAGES.LOADING} />
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-body-md text-body-md text-error" role="alert">
              {error}
            </p>
          </div>
        ) : delegations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span
              className="material-symbols-outlined text-[42px] text-on-surface-variant/50"
              aria-hidden="true"
            >
              swap_horiz
            </span>
            <h2 className="mt-3 font-headline-md text-headline-md text-on-background">
              {INCOMING_DELEGATION_MESSAGES.EMPTY_TITLE}
            </h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {INCOMING_DELEGATION_MESSAGES.EMPTY_DESCRIPTION}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/40">
                  {[
                    'Akademisyen',
                    'Ders',
                    'Kategori',
                    'Tarih',
                    'Saat',
                    'Görüşme Türü',
                    'Oluşturulma',
                    'Durum',
                    '',
                  ].map((label) => (
                    <th
                      key={label || 'actions'}
                      className="px-5 py-4 text-left font-label-md text-label-md font-semibold text-on-surface-variant"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {delegations.map((delegation) => {
                  const isActing = actionDelegationId === delegation.delegationId;
                  const actionsDisabled = actionDelegationId !== null;
                  return (
                    <tr
                      key={delegation.delegationId}
                      className="border-b border-outline-variant/40 transition-colors hover:bg-surface-container/30"
                    >
                      <td className="px-5 py-4 font-label-md text-label-md font-semibold text-on-background">
                        {delegation.delegatedByUserName ?? '-'}
                      </td>
                      <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                        {formatCourse(delegation)}
                      </td>
                      <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                        {delegation.categoryName ?? '-'}
                      </td>
                      <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                        {formatDate(delegation.appointmentDate)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-body-md text-body-md text-on-background">
                        {formatTime(delegation.startTime)} - {formatTime(delegation.endTime)}
                      </td>
                      <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                        {delegation.meetingType
                          ? getMeetingTypeLabel(delegation.meetingType)
                          : '-'}
                      </td>
                      <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                        {formatDateTime(delegation.delegatedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-0.5 font-label-sm text-label-sm text-amber-800">
                          <span
                            className="inline-block h-2 w-2 rounded-full bg-amber-500"
                            aria-hidden
                          />
                          {INCOMING_DELEGATION_MESSAGES.STATUS_PENDING}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <AdminActionButton
                            variant="primary"
                            icon="check"
                            disabled={actionsDisabled}
                            onClick={() =>
                              void handleDecision(delegation.delegationId, 'accept')
                            }
                          >
                            {isActing
                              ? 'İşleniyor...'
                              : INCOMING_DELEGATION_MESSAGES.ACCEPT_LABEL}
                          </AdminActionButton>
                          <AdminActionButton
                            variant="danger"
                            icon="close"
                            disabled={actionsDisabled}
                            onClick={() =>
                              void handleDecision(delegation.delegationId, 'reject')
                            }
                          >
                            {INCOMING_DELEGATION_MESSAGES.REJECT_LABEL}
                          </AdminActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
