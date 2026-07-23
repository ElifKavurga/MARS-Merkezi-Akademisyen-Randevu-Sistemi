import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import Loading from '../components/Loading';
import { getMeetingTypeLabel } from '../constants/appointment';
import { studentDelegationDetailPath } from '../constants/routes';
import { useToast } from '../hooks/useToast';
import {
  acceptStudentDelegation,
  getPendingStudentDelegations,
  rejectStudentDelegation,
} from '../services/delegationService';
import type { DelegationResponse } from '../types/delegation';

type Decision = { item: DelegationResponse; action: 'accept' | 'reject' } | null;

const date = (value: string | null) => value
  ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`))
  : '-';
const time = (value: string | null) => value?.slice(0, 5) ?? '-';
const course = (item: DelegationResponse) =>
  `${item.courseCode ?? ''} ${item.courseName ?? ''}`.trim() || '-';

function remaining(expiresAt: string | null, now: number): string {
  if (!expiresAt) return 'Süre sınırı yok';
  const milliseconds = Date.parse(expiresAt) - now;
  if (milliseconds <= 0) return 'Süre doldu';
  const totalMinutes = Math.ceil(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} sa ${minutes} dk kaldı` : `${minutes} dk kaldı`;
}

function message(error: unknown): string {
  if (isAxiosError(error)) {
    const backend = error.response?.data?.message;
    if (typeof backend === 'string' && backend) return backend;
  }
  return 'Randevu devri işlemi tamamlanamadı.';
}

export default function StudentDelegationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState<DelegationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getPendingStudentDelegations());
      setError(null);
    } catch (loadError) {
      setError(message(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const submit = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      if (decision.action === 'accept') {
        await acceptStudentDelegation(decision.item.delegationId);
        toast.success('Randevu devri kabul edildi.');
      } else {
        await rejectStudentDelegation(decision.item.delegationId);
        toast.success('Randevu devri reddedildi. Randevunuz mevcut personelde kaldı.');
      }
      setItems((current) => current.filter(
        (item) => item.delegationId !== decision.item.delegationId,
      ));
      setDecision(null);
    } catch (submitError) {
      toast.error(message(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <header className="mb-7">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Randevu Devri Talepleri</h1>
        <p className="mt-2 text-on-surface-variant">
          Onayınızı bekleyen randevu devri taleplerini inceleyin.
        </p>
      </header>

      {loading ? <div className="flex justify-center py-20"><Loading label="Talepler yükleniyor..." /></div> : null}
      {!loading && error ? (
        <div className="rounded-xl border border-error/30 bg-error-container/40 p-6 text-center">
          <p className="text-error" role="alert">{error}</p>
          <button className="mt-4 rounded-lg border border-outline-variant px-4 py-2" type="button" onClick={() => void load()}>
            Tekrar Dene
          </button>
        </div>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
          <span className="material-symbols-outlined text-[46px] text-on-surface-variant/50" aria-hidden>swap_horiz</span>
          <h2 className="mt-3 text-lg font-semibold">Bekleyen randevu devri talebiniz yok</h2>
          <p className="mt-2 text-on-surface-variant">Yeni bir talep geldiğinde burada görüntülenecektir.</p>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.delegationId}
              className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-5 shadow-sm transition hover:border-amber-400 hover:shadow-md dark:bg-amber-950/10"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => navigate(studentDelegationDetailPath(item.delegationId))}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-amber-900">
                      Onayınız bekleniyor
                    </span>
                    <span className="text-sm font-semibold text-amber-800">
                      {remaining(item.studentApprovalExpiresAt, now)}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-on-background">
                    {item.delegatedToUserName ?? 'Hedef personel'} kişisine randevu devri
                  </h2>
                  <p className="mt-2 text-on-surface-variant">
                    {course(item)} · {date(item.appointmentDate)} · {time(item.startTime)}–{time(item.endTime)}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {item.categoryName ?? '-'} · {item.meetingType ? getMeetingTypeLabel(item.meetingType) : '-'}
                  </p>
                </button>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <AdminActionButton variant="primary" icon="check" onClick={() => setDecision({ item, action: 'accept' })}>
                    Kabul Et
                  </AdminActionButton>
                  <AdminActionButton variant="danger" icon="close" onClick={() => setDecision({ item, action: 'reject' })}>
                    Reddet
                  </AdminActionButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ConfirmModal
        open={decision !== null}
        title={decision?.action === 'accept' ? 'Randevu Devrini Kabul Et' : 'Randevu Devrini Reddet'}
        description={decision?.action === 'accept'
          ? `Bu randevunun ${decision.item.delegatedToUserName ?? 'belirtilen kişiye'} devredilmesini kabul ediyor musunuz?`
          : 'Bu randevu devri talebini reddetmek istediğinize emin misiniz? Randevunuz mevcut personelde kalacaktır.'}
        confirmLabel={decision?.action === 'accept' ? 'Kabul Et' : 'Reddet'}
        variant={decision?.action === 'accept' ? 'primary' : 'danger'}
        loading={submitting}
        onClose={() => !submitting && setDecision(null)}
        onConfirm={() => void submit()}
      />
    </div>
  );
}
