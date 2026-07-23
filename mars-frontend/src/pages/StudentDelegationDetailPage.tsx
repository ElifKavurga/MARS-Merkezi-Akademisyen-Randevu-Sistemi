import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import DelegationStatusBadge from '../components/DelegationStatusBadge';
import Loading from '../components/Loading';
import { getMeetingTypeLabel } from '../constants/appointment';
import { ROUTES } from '../constants/routes';
import { useToast } from '../hooks/useToast';
import {
  acceptStudentDelegation,
  getDelegation,
  rejectStudentDelegation,
} from '../services/delegationService';
import type { DelegationResponse } from '../types/delegation';

type Action = 'accept' | 'reject';
const date = (value: string | null) => value
  ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`))
  : '-';
const dateTime = (value: string | null) => value
  ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '-';
const time = (value: string | null) => value?.slice(0, 5) ?? '-';

function remaining(expiresAt: string | null, now: number): string {
  if (!expiresAt) return 'Süre sınırı bulunmuyor';
  const difference = Date.parse(expiresAt) - now;
  if (difference <= 0) return 'Onay süresi doldu';
  const minutes = Math.ceil(difference / 60_000);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} saat ${minutes % 60} dakika`
    : `${minutes} dakika`;
}

function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const backend = error.response?.data?.message;
    if (typeof backend === 'string' && backend) return backend;
  }
  return 'Randevu devri detayı yüklenemedi.';
}

export default function StudentDelegationDetailPage() {
  const { delegationId } = useParams();
  const toast = useToast();
  const [item, setItem] = useState<DelegationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const id = Number(delegationId);
    if (!Number.isInteger(id) || id <= 0) {
      setError('Geçersiz randevu devri kaydı.');
      setLoading(false);
      return;
    }
    try {
      setItem(await getDelegation(id));
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [delegationId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const submit = async () => {
    if (!item || !action) return;
    setSubmitting(true);
    try {
      const updated = action === 'accept'
        ? await acceptStudentDelegation(item.delegationId)
        : await rejectStudentDelegation(item.delegationId);
      setItem(updated);
      setAction(null);
      toast.success(action === 'accept'
        ? 'Randevu devri kabul edildi.'
        : 'Randevu devri reddedildi. Randevunuz mevcut personelde kaldı.');
    } catch (submitError) {
      toast.error(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loading label="Detay yükleniyor..." /></div>;
  if (error || !item) return <div className="admin-page"><p className="rounded-xl border border-error/30 bg-error-container p-5 text-error">{error}</p></div>;

  const details = [
    ['Mevcut Akademisyen', item.delegatedByUserName ?? '-'],
    ['Devredilecek Akademisyen veya Asistan', item.delegatedToUserName ?? '-'],
    ['Ders', `${item.courseCode ?? ''} ${item.courseName ?? ''}`.trim() || '-'],
    ['Randevu Kategorisi', item.categoryName ?? '-'],
    ['Görüşme Türü', item.meetingType ? getMeetingTypeLabel(item.meetingType) : '-'],
    ['Tarih', date(item.appointmentDate)],
    ['Saat', `${time(item.startTime)}–${time(item.endTime)}`],
    ['Süre', item.durationMinutes ? `${item.durationMinutes} dakika` : '-'],
    ['Talep Oluşturulma Zamanı', dateTime(item.delegatedAt)],
    ['Kalan Onay Süresi', remaining(item.studentApprovalExpiresAt, now)],
  ];
  const pending = item.delegationStatus === 'PENDING_STUDENT_APPROVAL';

  return (
    <div className="admin-page animate-fade-in">
      <Link className="mb-5 inline-flex items-center gap-1 text-primary hover:underline" to={ROUTES.STUDENT_DELEGATIONS}>
        <span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_back</span>
        Randevu devri taleplerine dön
      </Link>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background">Randevu Devri Detayı</h1>
          <p className="mt-2 text-on-surface-variant">Karar vermeden önce değişiklikleri inceleyin.</p>
        </div>
        <DelegationStatusBadge status={item.delegationStatus} />
      </div>

      <section className={`rounded-xl border bg-surface-container-lowest p-6 ${pending ? 'border-amber-400 ring-2 ring-amber-200' : 'border-outline-variant'}`}>
        {pending ? (
          <div className="mb-6 rounded-lg bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
            Bu talep onayınızı bekliyor · {remaining(item.studentApprovalExpiresAt, now)}
          </div>
        ) : null}
        <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-on-surface-variant">{label}</dt>
              <dd className="mt-1 font-medium text-on-background">{value}</dd>
            </div>
          ))}
        </dl>
        {pending ? (
          <div className="mt-7 flex flex-wrap gap-3 border-t border-outline-variant pt-5">
            <AdminActionButton variant="primary" icon="check" onClick={() => setAction('accept')}>Kabul Et</AdminActionButton>
            <AdminActionButton variant="danger" icon="close" onClick={() => setAction('reject')}>Reddet</AdminActionButton>
          </div>
        ) : null}
      </section>

      <ConfirmModal
        open={action !== null}
        title={action === 'accept' ? 'Randevu Devrini Kabul Et' : 'Randevu Devrini Reddet'}
        description={action === 'accept'
          ? `Bu randevunun ${item.delegatedToUserName ?? 'belirtilen kişiye'} devredilmesini kabul ediyor musunuz?`
          : 'Bu randevu devri talebini reddetmek istediğinize emin misiniz? Randevunuz mevcut personelde kalacaktır.'}
        confirmLabel={action === 'accept' ? 'Kabul Et' : 'Reddet'}
        variant={action === 'accept' ? 'primary' : 'danger'}
        loading={submitting}
        onClose={() => !submitting && setAction(null)}
        onConfirm={() => void submit()}
      />
    </div>
  );
}
