import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import DelegationStatusBadge from '../components/DelegationStatusBadge';
import Loading from '../components/Loading';
import { getMeetingTypeLabel } from '../constants/appointment';
import { getDelegationStatusLabel } from '../constants/delegation';
import { ROUTES } from '../constants/routes';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import {
  acceptDelegation,
  getDelegation,
  rejectDelegation,
} from '../services/delegationService';
import type { DelegationResponse } from '../types/delegation';

type Action = 'accept' | 'reject';

const date = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`))
  : '-';
const dateTime = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '-';
const time = (value: string | null | undefined) => value?.slice(0, 5) ?? '-';

function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Randevu devri detayı yüklenemedi.';
}

export default function AcademicianIncomingDelegationDetailPage() {
  const { delegationId } = useParams();
  const toast = useToast();
  const { user } = useAuth();
  const [item, setItem] = useState<DelegationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const id = Number(delegationId);
    if (!Number.isInteger(id) || id <= 0) {
      setError('Geçersiz randevu devri kaydı.');
      setLoading(false);
      return;
    }
    setLoading(true);
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

  const submit = async () => {
    if (!item || !action) return;
    setSubmitting(true);
    try {
      if (action === 'accept') await acceptDelegation(item.delegationId);
      else await rejectDelegation(item.delegationId);
      toast.success(action === 'accept'
        ? 'Randevu devri talebi kabul edildi.'
        : 'Randevu devri reddedildi.');
      setAction(null);
      await load();
    } catch (submitError) {
      toast.error(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loading label="Detay yükleniyor..." /></div>;
  if (error || !item) return <div className="admin-page"><p className="rounded-xl border border-error/20 bg-error-container p-5 text-error">{error}</p></div>;

  const details = [
    ['Öğrenci', item.studentName ?? '-'],
    ['Öğrenci E-postası', item.studentEmail ?? '-'],
    ['Randevu Tarihi', date(item.appointmentDate)],
    ['Saat', `${time(item.startTime)}–${time(item.endTime)}`],
    ['Süre', item.durationMinutes ? `${item.durationMinutes} dakika` : '-'],
    ['Ders', `${item.courseCode ?? ''} ${item.courseName ?? ''}`.trim() || '-'],
    ['Randevu Kategorisi', item.categoryName ?? '-'],
    ['Görüşme Türü', item.meetingType ? getMeetingTypeLabel(item.meetingType) : '-'],
    ['Talebi Gönderen Akademisyen', item.delegatedByUserName ?? '-'],
    ['Talep Oluşturulma Zamanı', dateTime(item.delegatedAt)],
  ];
  const isTargetUser = item.delegatedToUserId === user?.userId;
  const actionable = isTargetUser && (user?.role === 'ASSISTANT'
    ? item.delegationStatus === 'PENDING'
    : item.delegationStatus === 'PENDING_ACADEMICIAN_APPROVAL');
  const backRoute = user?.role === 'ASSISTANT'
    ? ROUTES.ASSISTANT_DELEGATION_HISTORY
    : ROUTES.ACADEMICIAN_DELEGATION_HISTORY;

  return (
    <div className="admin-page animate-fade-in">
      <Link className="mb-5 inline-flex items-center gap-1 text-primary hover:underline" to={`${backRoute}?tab=incoming`}>
        <span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_back</span>
        Gelen taleplere dön
      </Link>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background">Randevu Devri Detayı</h1>
          <p className="mt-2 text-on-surface-variant">Talep #{item.delegationId}</p>
        </div>
        <DelegationStatusBadge status={item.delegationStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="mb-5 text-lg font-semibold">Randevu ve öğrenci bilgileri</h2>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-on-surface-variant">{label}</dt>
                <dd className="mt-1 font-medium text-on-background">{value}</dd>
              </div>
            ))}
          </dl>
          {actionable ? (
            <div className="mt-7 flex flex-wrap gap-3 border-t border-outline-variant pt-5">
              <AdminActionButton variant="primary" icon="check" onClick={() => setAction('accept')}>Kabul Et</AdminActionButton>
              <AdminActionButton variant="danger" icon="close" onClick={() => setAction('reject')}>Reddet</AdminActionButton>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="mb-5 text-lg font-semibold">Durum geçmişi</h2>
          <ol className="space-y-4">
            {(item.statusHistory ?? []).map((history, index) => (
              <li key={`${history.status}-${history.changedAt}-${index}`} className="relative border-l-2 border-outline-variant pl-5">
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary" aria-hidden />
                <p className="font-medium">{getDelegationStatusLabel(history.status)}</p>
                <time className="text-sm text-on-surface-variant">{dateTime(history.changedAt)}</time>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ConfirmModal
        open={action !== null}
        title={action === 'accept' ? 'Randevuyu Devral' : 'Randevu Devrini Reddet'}
        description={action === 'accept'
          ? 'Bu randevuyu devralmak istediğinize emin misiniz?'
          : 'Bu randevu devri talebini reddetmek istediğinize emin misiniz?'}
        confirmLabel={action === 'accept' ? 'Kabul Et' : 'Reddet'}
        variant={action === 'accept' ? 'primary' : 'danger'}
        loading={submitting}
        onClose={() => !submitting && setAction(null)}
        onConfirm={() => void submit()}
      />
    </div>
  );
}
