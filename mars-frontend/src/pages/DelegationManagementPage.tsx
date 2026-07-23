import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import DelegationStatusBadge from '../components/DelegationStatusBadge';
import Loading from '../components/Loading';
import StudentSegmentedTabs from '../components/StudentSegmentedTabs';
import {
  academicianIncomingDelegationDetailPath,
  assistantDelegationDetailPath,
} from '../constants/routes';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants/ui';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  acceptDelegation,
  getReceivedDelegations,
  getSentDelegations,
  rejectDelegation,
} from '../services/delegationService';
import type { DelegationResponse } from '../types/delegation';

type Tab = 'incoming' | 'sent';
type Decision = { item: DelegationResponse; action: 'accept' | 'reject' } | null;

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('tr-TR').format(new Date(`${value}T00:00:00`))
  : '-';
const formatDateTime = (value: string) => new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format(new Date(value));
const formatTime = (value: string | null) => value?.slice(0, 5) ?? '-';

function errorMessage(error: unknown): string {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return 'Randevu devri talepleri yüklenemedi.';
}

export default function DelegationManagementPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const initialTab: Tab = params.get('tab') === 'incoming'
    || location.pathname.endsWith('/incoming') ? 'incoming' : 'sent';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [incoming, setIncoming] = useState<DelegationResponse[]>([]);
  const [sent, setSent] = useState<DelegationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [date, setDate] = useState(params.get('date') ?? '');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incomingData, sentData] = await Promise.all([
        getReceivedDelegations(),
        getSentDelegations(),
      ]);
      setIncoming(incomingData);
      setSent(sentData);
    } catch (loadError) {
      const message = errorMessage(loadError);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.role === 'ACADEMICIAN' || user?.role === 'ASSISTANT') void load();
  }, [load, user]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    search ? next.set('q', search) : next.delete('q');
    status ? next.set('status', status) : next.delete('status');
    date ? next.set('date', date) : next.delete('date');
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [date, params, search, setParams, status, tab]);

  const active = tab === 'incoming' ? incoming : sent;
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr-TR');
    return active.filter((item) => {
      if (status && item.delegationStatus !== status) return false;
      if (date && item.appointmentDate !== date) return false;
      if (!query) return true;
      return [
        item.studentName,
        item.delegatedByUserName,
        item.delegatedToUserName,
        item.courseCode,
        item.courseName,
      ].some((value) => value?.toLocaleLowerCase('tr-TR').includes(query));
    });
  }, [active, date, search, status]);

  const submitDecision = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      const result = decision.action === 'accept'
        ? await acceptDelegation(decision.item.delegationId)
        : await rejectDelegation(decision.item.delegationId);
      setIncoming((current) => current
        .map((item) => item.delegationId === result.delegationId ? result : item));
      toast.success(decision.action === 'accept'
        ? 'Randevu devri talebi kabul edildi.'
        : 'Randevu devri talebi reddedildi.');
      setDecision(null);
    } catch (actionError) {
      toast.error(errorMessage(actionError));
    } finally {
      setSubmitting(false);
    }
  };

  const changeTab = (nextTab: Tab) => {
    setTab(nextTab);
    setStatus('');
    setDate('');
  };

  const openDetail = (delegationId: number) => {
    navigate(user?.role === 'ASSISTANT'
      ? assistantDelegationDetailPath(delegationId)
      : academicianIncomingDelegationDetailPath(delegationId));
  };

  return (
    <div className="admin-page animate-fade-in">
      <header className="mb-6">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Randevu Devri</h1>
        <p className="mt-2 text-on-surface-variant">
          Gelen ve gönderilen randevu devri taleplerini tek ekrandan yönetin.
        </p>
      </header>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex border-b border-outline-variant p-4" role="tablist" aria-label="Randevu devri talepleri">
          <StudentSegmentedTabs
            value={tab}
            options={[
              { value: 'incoming', label: `Gelen Talepler (${incoming.length})` },
              { value: 'sent', label: `Gönderilen Talepler (${sent.length})` },
            ] as const}
            ariaLabel="Randevu devri talepleri"
            onChange={(val) => changeTab(val as Tab)}
          />
        </div>

        <div className="grid gap-3 border-b border-outline-variant p-4 md:grid-cols-3">
          <input className={FORM_FIELD_CLASS} type="search" value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Öğrenci, akademisyen veya ders ara" aria-label="Taleplerde ara" />
          <select className={FORM_SELECT_CLASS} value={status}
            onChange={(event) => setStatus(event.target.value)} aria-label="Durum filtresi">
            <option value="">Tüm durumlar</option>
            <option value="PENDING">Bekliyor</option>
            <option value="PENDING_ACADEMICIAN_APPROVAL">Akademisyen Onayı Bekliyor</option>
            <option value="PENDING_STUDENT_APPROVAL">Öğrenci Onayı Bekliyor</option>
            <option value="ACCEPTED">Kabul Edildi</option>
            <option value="REJECTED">Reddedildi</option>
            <option value="EXPIRED">Süresi Doldu</option>
            <option value="COMPLETED">Tamamlandı</option>
            <option value="CANCELLED">İptal Edildi</option>
          </select>
          <input className={FORM_FIELD_CLASS} type="date" value={date}
            onChange={(event) => setDate(event.target.value)} aria-label="Randevu tarihi filtresi" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loading label="Talepler yükleniyor..." /></div>
        ) : error ? (
          <p className="px-6 py-12 text-center text-error" role="alert">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-14 text-center text-on-surface-variant">
            {tab === 'incoming' ? 'Gelen randevu devri talebi bulunmuyor.' : 'Gönderilen randevu devri talebi bulunmuyor.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="bg-surface-container/40">
                <tr>
                  {(tab === 'incoming'
                    ? ['Gönderen', 'Öğrenci', 'Ders', 'Tarih', 'Saat', 'Durum', 'İşlemler']
                    : ['Hedef Kişi', 'Öğrenci', 'Tarih', 'Saat', 'Durum', 'Oluşturulma', 'İşlemler']
                  ).map((label) => (
                    <th key={label} className="border-b border-outline-variant px-4 py-3 text-left text-sm font-semibold text-on-surface-variant">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const actionable = ['PENDING', 'PENDING_ACADEMICIAN_APPROVAL'].includes(item.delegationStatus);
                  const course = `${item.courseCode ?? ''} ${item.courseName ?? ''}`.trim() || '-';
                  return tab === 'incoming' ? (
                    <tr key={item.delegationId}
                      className={`${actionable ? 'bg-primary-fixed/35' : ''} border-b border-outline-variant/40 hover:bg-surface-container/30`}>
                      <td className="px-4 py-4">{item.delegatedByUserName ?? '-'}</td>
                      <td className="px-4 py-4 font-semibold">{item.studentName ?? '-'}</td>
                      <td className="px-4 py-4">{course}</td>
                      <td className="px-4 py-4">{formatDate(item.appointmentDate)}</td>
                      <td className="whitespace-nowrap px-4 py-4">{formatTime(item.startTime)}–{formatTime(item.endTime)}</td>
                      <td className="px-4 py-4"><DelegationStatusBadge status={item.delegationStatus} /></td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {actionable ? <>
                            <AdminActionButton variant="primary" icon="check" onClick={() => setDecision({ item, action: 'accept' })}>Kabul Et</AdminActionButton>
                            <AdminActionButton variant="danger" icon="close" onClick={() => setDecision({ item, action: 'reject' })}>Reddet</AdminActionButton>
                          </> : null}
                          <AdminActionButton variant="neutral" icon="visibility" onClick={() => openDetail(item.delegationId)}>Detayı Gör</AdminActionButton>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.delegationId} className="border-b border-outline-variant/40 hover:bg-surface-container/30">
                      <td className="px-4 py-4 font-semibold">{item.delegatedToUserName ?? '-'}</td>
                      <td className="px-4 py-4">{item.studentName ?? '-'}</td>
                      <td className="px-4 py-4">{formatDate(item.appointmentDate)}</td>
                      <td className="whitespace-nowrap px-4 py-4">{formatTime(item.startTime)}–{formatTime(item.endTime)}</td>
                      <td className="px-4 py-4"><DelegationStatusBadge status={item.delegationStatus} /></td>
                      <td className="whitespace-nowrap px-4 py-4">{formatDateTime(item.delegatedAt)}</td>
                      <td className="px-4 py-4">
                        <AdminActionButton variant="neutral" icon="visibility" onClick={() => openDetail(item.delegationId)}>Detayı Gör</AdminActionButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmModal open={decision !== null}
        title={decision?.action === 'accept' ? 'Randevuyu Devral' : 'Randevu Devrini Reddet'}
        description={decision?.action === 'accept'
          ? 'Bu randevuyu devralmak istediğinize emin misiniz?'
          : 'Bu randevu devri talebini reddetmek istediğinize emin misiniz?'}
        confirmLabel={decision?.action === 'accept' ? 'Kabul Et' : 'Reddet'}
        variant={decision?.action === 'accept' ? 'primary' : 'danger'}
        loading={submitting} onClose={() => !submitting && setDecision(null)}
        onConfirm={() => void submitDecision()} />
    </div>
  );
}
