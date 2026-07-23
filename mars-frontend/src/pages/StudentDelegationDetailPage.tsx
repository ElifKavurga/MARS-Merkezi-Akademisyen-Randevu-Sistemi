import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { useParams } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import DelegationStatusBadge from '../components/DelegationStatusBadge';
import Loading from '../components/Loading';
import StudentBackLink from '../components/StudentBackLink';
import StudentPageHeader from '../components/StudentPageHeader';
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

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <span
        className="material-symbols-outlined mt-0.5 text-[16px] text-on-surface-variant"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        <div className="mt-0.5 break-words font-body-md text-[13px] leading-5 text-on-surface">
          {value}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 sm:p-4">
      <h2 className="mb-3 font-headline-md text-[16px] font-semibold leading-5 text-on-background">
        {title}
      </h2>
      {children}
    </section>
  );
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
  if (error || !item) return <div className="w-full min-w-0"><p className="rounded-xl border border-error/30 bg-error-container p-5 text-error">{error}</p></div>;

  const pending = item.delegationStatus === 'PENDING_STUDENT_APPROVAL';

  return (
    <div className="w-full min-w-0 animate-fade-in flex flex-col gap-3 md:gap-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <StudentBackLink to={ROUTES.STUDENT_DELEGATIONS} label="Randevu devri taleplerine dön" />
        {pending ? (
          <div className="flex flex-wrap gap-2">
            <AdminActionButton variant="primary" icon="check" onClick={() => setAction('accept')}>Kabul Et</AdminActionButton>
            <AdminActionButton variant="danger" icon="close" onClick={() => setAction('reject')}>Reddet</AdminActionButton>
          </div>
        ) : null}
      </div>

      <StudentPageHeader
        title="Randevu Devri Detayı"
        description="Karar vermeden önce değişiklikleri inceleyin."
        actions={<DelegationStatusBadge status={item.delegationStatus} />}
      />

      {pending ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary-container/35 px-4 py-3 text-sm font-semibold text-on-primary-container">
          <span className="material-symbols-outlined text-[20px]" aria-hidden>schedule</span>
          <span>Bu talep onayınızı bekliyor · {remaining(item.studentApprovalExpiresAt, now)}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:gap-4">
        <InfoCard title="Devir Bilgileri">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <MetaRow icon="person" label="Mevcut Akademisyen" value={item.delegatedByUserName ?? '-'} />
            <MetaRow icon="person" label="Devredilecek Akademisyen veya Asistan" value={item.delegatedToUserName ?? '-'} />
            <MetaRow icon="event" label="Talep Oluşturulma Zamanı" value={dateTime(item.delegatedAt)} />
            <MetaRow icon="timer" label="Kalan Onay Süresi" value={remaining(item.studentApprovalExpiresAt, now)} />
          </div>
        </InfoCard>

        <InfoCard title="Randevu Bilgileri">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <MetaRow icon="menu_book" label="Ders" value={`${item.courseCode ?? ''} ${item.courseName ?? ''}`.trim() || '-'} />
            <MetaRow icon="category" label="Randevu Kategorisi" value={item.categoryName ?? '-'} />
            <MetaRow icon="event" label="Tarih" value={date(item.appointmentDate)} />
            <MetaRow icon="schedule" label="Saat" value={`${time(item.startTime)}–${time(item.endTime)}`} />
            <MetaRow icon="timer" label="Süre" value={item.durationMinutes ? `${item.durationMinutes} dakika` : '-'} />
            <MetaRow icon="videocam" label="Görüşme Türü" value={item.meetingType ? getMeetingTypeLabel(item.meetingType) : '-'} />
          </div>
        </InfoCard>
      </div>

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
