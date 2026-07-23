import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import DelegationStatusBadge from '../components/DelegationStatusBadge';
import Loading from '../components/Loading';
import { getMeetingTypeLabel } from '../constants/appointment';
import { studentDelegationDetailPath } from '../constants/routes';
import { useToast } from '../hooks/useToast';
import {
  acceptStudentDelegation,
  getStudentDelegations,
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
      setItems(await getStudentDelegations());
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
      const updated = decision.action === 'accept'
        ? await acceptStudentDelegation(decision.item.delegationId)
        : await rejectStudentDelegation(decision.item.delegationId);
      if (decision.action === 'accept') {
        toast.success('Randevu devri kabul edildi.');
      } else {
        toast.success('Randevu devri reddedildi. Randevunuz mevcut personelde kaldı.');
      }
      setItems((current) => current.map(
        (item) => item.delegationId === updated.delegationId ? updated : item,
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
          Bekleyen ve geçmiş randevu devri taleplerinizi inceleyin.
        </p>
      </header>

      {loading ? <div className="flex justify-center py-20"><Loading label="Talepler yükleniyor..." /></div> : null}
      {!loading && error ? (
        <div className="rounded-xl border border-error/30 bg-error-container/40 p-6 text-center">
          <p className="text-error" role="alert">{error}</p>
          <AdminActionButton className="mt-4" variant="neutral" icon="refresh" onClick={() => void load()}>
            Tekrar Dene
          </AdminActionButton>
        </div>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
          <span className="material-symbols-outlined text-[46px] text-on-surface-variant/50" aria-hidden>swap_horiz</span>
          <h2 className="mt-3 text-lg font-semibold">Randevu devri kaydınız yok</h2>
          <p className="mt-2 text-on-surface-variant">Yeni bir talep oluştuğunda burada görüntülenecektir.</p>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => {
            const pending = item.delegationStatus === 'PENDING_STUDENT_APPROVAL';
            return (
            <article
              key={item.delegationId}
              className={`rounded-xl border bg-surface-container-lowest p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                pending ? 'border-primary/50 shadow-sm ring-1 ring-primary/15' : 'border-outline-variant'
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-on-surface-variant">Devredilecek kişi</p>
                    <h2 className="mt-1 text-lg font-semibold text-on-background">
                      {item.delegatedToUserName ?? 'Hedef personel'}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <DelegationStatusBadge status={item.delegationStatus} />
                    {pending ? <span className="text-sm font-semibold text-primary">
                      {remaining(item.studentApprovalExpiresAt, now)}
                    </span> : null}
                  </div>
                </div>
                <div className="grid gap-3 rounded-lg bg-surface-container/55 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <p><span className="block text-xs text-on-surface-variant">Ders</span>{course(item)}</p>
                  <p><span className="block text-xs text-on-surface-variant">Tarih ve saat</span>{date(item.appointmentDate)} · {time(item.startTime)}–{time(item.endTime)}</p>
                  <p><span className="block text-xs text-on-surface-variant">Kategori</span>{item.categoryName ?? '-'}</p>
                  <p><span className="block text-xs text-on-surface-variant">Görüşme</span>{item.meetingType ? getMeetingTypeLabel(item.meetingType) : '-'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/60 pt-4">
                  {pending ? <>
                    <AdminActionButton variant="primary" icon="check" onClick={() => setDecision({ item, action: 'accept' })}>Kabul Et</AdminActionButton>
                    <AdminActionButton variant="danger" icon="close" onClick={() => setDecision({ item, action: 'reject' })}>Reddet</AdminActionButton>
                  </> : null}
                  <AdminActionButton variant="neutral" icon="visibility"
                    onClick={() => navigate(studentDelegationDetailPath(item.delegationId))}>
                    Detayı Gör
                  </AdminActionButton>
                </div>
              </div>
            </article>
          );})}
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
