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
  if (error || !item) return <div className="w-full min-w-0"><p className="rounded-xl border border-error/20 bg-error-container p-5 text-error">{error}</p></div>;

  const isTargetUser = item.delegatedToUserId === user?.userId;
  const actionable = isTargetUser && (user?.role === 'ASSISTANT'
    ? item.delegationStatus === 'PENDING'
    : item.delegationStatus === 'PENDING_ACADEMICIAN_APPROVAL');
  const backRoute = user?.role === 'ASSISTANT'
    ? ROUTES.ASSISTANT_DELEGATION_HISTORY
    : ROUTES.ACADEMICIAN_DELEGATION_HISTORY;

  return (
    <div className="w-full min-w-0 animate-fade-in flex flex-col gap-3 md:gap-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <StudentBackLink to={`${backRoute}?tab=incoming`} label="Gelen taleplere dön" />
        {actionable ? (
          <div className="flex flex-wrap gap-2">
            <AdminActionButton variant="primary" icon="check" onClick={() => setAction('accept')}>Kabul Et</AdminActionButton>
            <AdminActionButton variant="danger" icon="close" onClick={() => setAction('reject')}>Reddet</AdminActionButton>
          </div>
        ) : null}
      </div>

      <StudentPageHeader
        title="Randevu Devri Detayı"
        description={`Talep #${item.delegationId}`}
        actions={<DelegationStatusBadge status={item.delegationStatus} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-3 md:gap-4">
          <InfoCard title="Öğrenci Bilgileri">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <MetaRow icon="person" label="Öğrenci" value={item.studentName ?? '-'} />
              <MetaRow icon="mail" label="Öğrenci E-postası" value={item.studentEmail ?? '-'} />
            </div>
          </InfoCard>

          <InfoCard title="Randevu Bilgileri">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <MetaRow icon="menu_book" label="Ders" value={`${item.courseCode ?? ''} ${item.courseName ?? ''}`.trim() || '-'} />
              <MetaRow icon="category" label="Randevu Kategorisi" value={item.categoryName ?? '-'} />
              <MetaRow icon="event" label="Randevu Tarihi" value={date(item.appointmentDate)} />
              <MetaRow icon="schedule" label="Saat" value={`${time(item.startTime)}–${time(item.endTime)}`} />
              <MetaRow icon="timer" label="Süre" value={item.durationMinutes ? `${item.durationMinutes} dakika` : '-'} />
              <MetaRow icon="videocam" label="Görüşme Türü" value={item.meetingType ? getMeetingTypeLabel(item.meetingType) : '-'} />
            </div>
          </InfoCard>

          <InfoCard title="Devir Bilgileri">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <MetaRow icon="person" label="Talebi Gönderen Akademisyen" value={item.delegatedByUserName ?? '-'} />
              <MetaRow icon="event" label="Talep Oluşturulma Zamanı" value={dateTime(item.delegatedAt)} />
              <MetaRow icon="flag" label="Durum" value={<DelegationStatusBadge status={item.delegationStatus} />} />
            </div>
          </InfoCard>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          <InfoCard title="Durum Geçmişi">
            <ol className="space-y-4">
              {(item.statusHistory ?? []).map((history, index) => (
                <li key={`${history.status}-${history.changedAt}-${index}`} className="relative border-l-2 border-outline-variant pl-5">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary" aria-hidden />
                  <p className="font-medium">{getDelegationStatusLabel(history.status)}</p>
                  <time className="text-sm text-on-surface-variant">{dateTime(history.changedAt)}</time>
                </li>
              ))}
            </ol>
          </InfoCard>
        </div>
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
