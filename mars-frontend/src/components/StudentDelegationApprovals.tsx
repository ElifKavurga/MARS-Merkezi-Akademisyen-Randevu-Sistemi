import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { STUDENT_UI } from '../constants/studentUi';
import { useToast } from '../hooks/useToast';
import {
  acceptStudentDelegation,
  getPendingStudentDelegations,
  rejectStudentDelegation,
} from '../services/delegationService';
import type { DelegationResponse } from '../types/delegation';
import Loading from './Loading';

type Props = { onDecision: () => void };

function timeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return '';
  const minutes = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60_000));
  return `${minutes} dakika yanıt süresi kaldı`;
}

export default function StudentDelegationApprovals({ onDecision }: Props) {
  const toast = useToast();
  const [items, setItems] = useState<DelegationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getPendingStudentDelegations());
    } catch {
      setError('Randevu devri onayları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const decide = async (item: DelegationResponse, accept: boolean) => {
    if (processingId !== null) return;
    setProcessingId(item.delegationId);
    try {
      if (accept) await acceptStudentDelegation(item.delegationId);
      else await rejectStudentDelegation(item.delegationId);
      setItems((current) => current.filter((entry) => entry.delegationId !== item.delegationId));
      toast.success(accept ? 'Randevu devri kabul edildi.' : 'Randevu devri reddedildi.');
      onDecision();
    } catch (err) {
      const backendMessage = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(typeof backendMessage === 'string' ? backendMessage : 'İşlem tamamlanamadı.');
      void load();
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"><Loading variant="inline" label="Randevu devri onayları yükleniyor..." /></div>;
  }
  if (error) {
    return <div className="mb-6 rounded-xl border border-error/30 bg-error-container/30 p-4"><p className="text-error" role="alert">{error}</p><button type="button" className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} mt-3`} onClick={() => void load()}>Tekrar Dene</button></div>;
  }
  if (items.length === 0) return null;

  return (
    <section className="mb-6 space-y-3" aria-labelledby="student-delegation-approvals-title">
      <div>
        <h2 id="student-delegation-approvals-title" className="font-headline-md text-headline-md text-on-background">Randevu Devri Onayları</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">Randevunuzun farklı bir personele devredilmesi için onayınız bekleniyor.</p>
      </div>
      {items.map((item) => (
        <article key={item.delegationId} className="rounded-xl border border-secondary/30 bg-secondary-container/30 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-label-md text-label-md font-semibold text-on-background">{item.delegatedByUserName} → {item.delegatedToUserName}</p>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{item.courseCode} {item.courseName} · {item.appointmentDate} · {item.startTime?.slice(0, 5)}</p>
              <p className="mt-2 font-label-sm text-label-sm font-semibold text-secondary">{timeRemaining(item.studentApprovalExpiresAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={STUDENT_UI.PRIMARY_BUTTON_CLASS} disabled={processingId !== null} onClick={() => void decide(item, true)}>Kabul Et</button>
              <button type="button" className={STUDENT_UI.SECONDARY_BUTTON_CLASS} disabled={processingId !== null} onClick={() => void decide(item, false)}>Reddet</button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
