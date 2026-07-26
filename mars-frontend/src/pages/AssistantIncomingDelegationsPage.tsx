import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import DelegationStatusBadge from '../components/DelegationStatusBadge';
import Loading from '../components/Loading';
import { getMeetingTypeLabel } from '../constants/appointment';
import { INCOMING_DELEGATION_MESSAGES } from '../constants/delegation';
import { academicianIncomingDelegationDetailPath } from '../constants/routes';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants/ui';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  acceptDelegation,
  getIncomingDelegations,
  rejectDelegation,
} from '../services/delegationService';
import type { DelegationResponse } from '../types/delegation';

type DecisionAction = 'accept' | 'reject';
type PendingDecision = { delegation: DelegationResponse; action: DecisionAction } | null;

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('tr-TR').format(new Date(`${value}T00:00:00`))
  : '-';
const formatDateTime = (value: string) => new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format(new Date(value));
const formatTime = (value: string | null) => value?.slice(0, 5) ?? '-';
const formatCourse = (item: DelegationResponse) =>
  `${item.courseCode ?? ''} ${item.courseName ?? ''}`.trim() || '-';

function backendMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  return typeof message === 'string' && message ? message : fallback;
}

export default function AssistantIncomingDelegationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [delegations, setDelegations] = useState<DelegationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<PendingDecision>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [academicianFilter, setAcademicianFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDelegations(await getIncomingDelegations());
    } catch (loadError) {
      const message = backendMessage(loadError, INCOMING_DELEGATION_MESSAGES.LOAD_ERROR);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user || (user.role !== 'ASSISTANT' && user.role !== 'ACADEMICIAN')) {
      setLoading(false);
      setError(INCOMING_DELEGATION_MESSAGES.ACCESS_DENIED);
      return;
    }
    void load();
  }, [load, user]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr-TR');
    const student = studentFilter.trim().toLocaleLowerCase('tr-TR');
    const academician = academicianFilter.trim().toLocaleLowerCase('tr-TR');
    const course = courseFilter.trim().toLocaleLowerCase('tr-TR');
    return delegations.filter((item) => {
      if (status && item.delegationStatus !== status) return false;
      if (date && item.appointmentDate !== date) return false;
      if (student && !item.studentName?.toLocaleLowerCase('tr-TR').includes(student)) return false;
      if (academician
        && !item.delegatedByUserName?.toLocaleLowerCase('tr-TR').includes(academician)) return false;
      if (course && !formatCourse(item).toLocaleLowerCase('tr-TR').includes(course)) return false;
      if (!query) return true;
      return [
        item.studentName,
        item.delegatedByUserName,
        item.courseCode,
        item.courseName,
      ].some((value) => value?.toLocaleLowerCase('tr-TR').includes(query));
    });
  }, [academicianFilter, courseFilter, date, delegations, search, status, studentFilter]);

  const submitDecision = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      const result = decision.action === 'accept'
        ? await acceptDelegation(decision.delegation.delegationId)
        : await rejectDelegation(decision.delegation.delegationId);
      setDelegations((current) => current
        .map((item) => item.delegationId === result.delegationId ? result : item)
        .filter((item) => item.delegationStatus === 'PENDING_ACADEMICIAN_APPROVAL'
          || item.delegationStatus === 'PENDING_STUDENT_APPROVAL'));
      toast.success(decision.action === 'accept'
        ? INCOMING_DELEGATION_MESSAGES.ACADEMICIAN_ACCEPT_SUCCESS
        : INCOMING_DELEGATION_MESSAGES.REJECT_SUCCESS);
      setDecision(null);
      await queryClient.invalidateQueries({ queryKey: ['dashboard-daily-schedule'] });
    } catch (actionError) {
      toast.error(backendMessage(actionError, INCOMING_DELEGATION_MESSAGES.ACTION_ERROR));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <header className="mb-7">
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          Kendime Gelen Randevu Devri Talepleri
        </h1>
        
      </header>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="grid gap-3 border-b border-outline-variant p-4 md:grid-cols-2 xl:grid-cols-3">
          <input
            className={FORM_FIELD_CLASS}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tüm alanlarda ara"
            aria-label="Randevu devri taleplerinde ara"
          />
          <select
            className={FORM_SELECT_CLASS}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Durum filtresi"
          >
            <option value="">Tüm aktif durumlar</option>
            <option value="PENDING_ACADEMICIAN_APPROVAL">Akademisyen Onayı Bekliyor</option>
            <option value="PENDING_STUDENT_APPROVAL">Öğrenci Onayı Bekliyor</option>
          </select>
          <input
            className={FORM_FIELD_CLASS}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Randevu tarihi filtresi"
          />
          <input
            className={FORM_FIELD_CLASS}
            value={studentFilter}
            onChange={(event) => setStudentFilter(event.target.value)}
            placeholder="Öğrenciye göre filtrele"
            aria-label="Öğrenci filtresi"
          />
          <input
            className={FORM_FIELD_CLASS}
            value={academicianFilter}
            onChange={(event) => setAcademicianFilter(event.target.value)}
            placeholder="Akademisyene göre filtrele"
            aria-label="Akademisyen filtresi"
          />
          <input
            className={FORM_FIELD_CLASS}
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            placeholder="Derse göre filtrele"
            aria-label="Ders filtresi"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loading label="Talepler yükleniyor..." /></div>
        ) : error ? (
          <p className="px-6 py-12 text-center text-error" role="alert">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-14 text-center text-on-surface-variant">
            Filtrelere uygun aktif randevu devri talebi bulunamadı.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1380px] border-collapse">
              <thead className="bg-surface-container/40">
                <tr>
                  {['Öğrenci', 'Tarih', 'Saat', 'Süre', 'Ders', 'Kategori', 'Görüşme Türü',
                    'Gönderen Akademisyen', 'Oluşturulma', 'Durum', 'İşlemler'].map((label) => (
                    <th key={label} className="border-b border-outline-variant px-4 py-3 text-left text-sm font-semibold text-on-surface-variant">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const actionable = item.delegationStatus === 'PENDING_ACADEMICIAN_APPROVAL';
                  return (
                    <tr
                      key={item.delegationId}
                      className={`${user?.role === 'ACADEMICIAN' ? 'cursor-pointer' : ''} border-b border-outline-variant/40 hover:bg-surface-container/30`}
                      onClick={() => {
                        if (user?.role === 'ACADEMICIAN') {
                          navigate(academicianIncomingDelegationDetailPath(item.delegationId));
                        }
                      }}
                    >
                      <td className="px-4 py-4 font-semibold">{item.studentName ?? '-'}</td>
                      <td className="px-4 py-4">{formatDate(item.appointmentDate)}</td>
                      <td className="whitespace-nowrap px-4 py-4">{formatTime(item.startTime)}–{formatTime(item.endTime)}</td>
                      <td className="px-4 py-4">{item.durationMinutes ? `${item.durationMinutes} dk` : '-'}</td>
                      <td className="px-4 py-4">{formatCourse(item)}</td>
                      <td className="px-4 py-4">{item.categoryName ?? '-'}</td>
                      <td className="px-4 py-4">{item.meetingType ? getMeetingTypeLabel(item.meetingType) : '-'}</td>
                      <td className="px-4 py-4">{item.delegatedByUserName ?? '-'}</td>
                      <td className="whitespace-nowrap px-4 py-4">{formatDateTime(item.delegatedAt)}</td>
                      <td className="px-4 py-4"><DelegationStatusBadge status={item.delegationStatus} /></td>
                      <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                        {actionable ? (
                          <div className="flex gap-2">
                            <AdminActionButton variant="primary" icon="check" onClick={() => setDecision({ delegation: item, action: 'accept' })}>
                              Kabul Et
                            </AdminActionButton>
                            <AdminActionButton variant="danger" icon="close" onClick={() => setDecision({ delegation: item, action: 'reject' })}>
                              Reddet
                            </AdminActionButton>
                          </div>
                        ) : <span className="text-sm text-on-surface-variant">Öğrenci yanıtı bekleniyor</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmModal
        open={decision !== null}
        title={decision?.action === 'accept' ? 'Randevuyu Devral' : 'Randevu Devrini Reddet'}
        description={decision?.action === 'accept'
          ? 'Bu randevuyu devralmak istediğinize emin misiniz? Kabulün ardından öğrenci onayı istenecektir.'
          : 'Bu randevu devri talebini reddetmek istediğinize emin misiniz? Talep doğrudan reddedilecektir.'}
        confirmLabel={decision?.action === 'accept' ? 'Kabul Et' : 'Reddet'}
        variant={decision?.action === 'accept' ? 'primary' : 'danger'}
        loading={submitting}
        onClose={() => !submitting && setDecision(null)}
        onConfirm={() => void submitDecision()}
      />
    </div>
  );
}
