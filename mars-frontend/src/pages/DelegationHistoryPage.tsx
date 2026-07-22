import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useSearchParams } from 'react-router-dom';
import DelegationStatusBadge from '../components/DelegationStatusBadge';
import Loading from '../components/Loading';
import { getMeetingTypeLabel } from '../constants/appointment';
import { DELEGATION_HISTORY_MESSAGES } from '../constants/delegation';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants/ui';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getDelegationHistory } from '../services/delegationService';
import type { DelegationResponse } from '../types/delegation';

const VALID_STATUS_FILTERS = new Set([
  'PENDING', 'PENDING_STUDENT_APPROVAL', 'ACCEPTED', 'REJECTED', 'STUDENT_REJECTED', 'EXPIRED',
]);

function resolveStatusFilter(raw: string | null): string {
  if (!raw) {
    return '';
  }
  const normalized = raw.trim().toUpperCase();
  return VALID_STATUS_FILTERS.has(normalized) ? normalized : '';
}

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

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
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

function toDateKey(value: string): string {
  return value.slice(0, 10);
}

function getBackendErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) {
    return fallback;
  }
  if (err.response?.status === 403) {
    return DELEGATION_HISTORY_MESSAGES.ACCESS_DENIED;
  }
  const backendMessage = err.response?.data?.message;
  if (typeof backendMessage === 'string' && backendMessage.length > 0) {
    return backendMessage;
  }
  return fallback;
}

export default function DelegationHistoryPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [delegations, setDelegations] = useState<DelegationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() =>
    resolveStatusFilter(searchParams.get('status')),
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    setStatusFilter(resolveStatusFilter(searchParams.get('status')));
  }, [searchParams]);

  useEffect(() => {
    if (!user || (user.role !== 'ACADEMICIAN' && user.role !== 'ASSISTANT')) {
      setLoading(false);
      setError(DELEGATION_HISTORY_MESSAGES.ACCESS_DENIED);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDelegationHistory();
        if (!cancelled) {
          setDelegations(data);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = getBackendErrorMessage(
          err,
          DELEGATION_HISTORY_MESSAGES.LOAD_ERROR,
        );
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [toast, user]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set('status', value);
    } else {
      nextParams.delete('status');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const filteredDelegations = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR');
    return delegations.filter((delegation) => {
      if (statusFilter && delegation.delegationStatus !== statusFilter) {
        return false;
      }

      const createdKey = toDateKey(delegation.delegatedAt);
      if (dateFrom && createdKey < dateFrom) {
        return false;
      }
      if (dateTo && createdKey > dateTo) {
        return false;
      }

      if (!query) {
        return true;
      }

      const academician = (delegation.delegatedByUserName ?? '').toLocaleLowerCase('tr-TR');
      const assistant = (delegation.delegatedToUserName ?? '').toLocaleLowerCase('tr-TR');
      const course = formatCourse(delegation).toLocaleLowerCase('tr-TR');
      return (
        academician.includes(query)
        || assistant.includes(query)
        || course.includes(query)
      );
    });
  }, [dateFrom, dateTo, delegations, searchQuery, statusFilter]);

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          {DELEGATION_HISTORY_MESSAGES.TITLE}
        </h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          {DELEGATION_HISTORY_MESSAGES.SUBTITLE}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="grid gap-3 border-b border-outline-variant p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="search"
              className={`${FORM_FIELD_CLASS} pl-10`}
              placeholder={DELEGATION_HISTORY_MESSAGES.SEARCH_PLACEHOLDER}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Randevu devri ara"
            />
          </div>

          <select
            className={FORM_SELECT_CLASS}
            aria-label="Durum filtresi"
            value={statusFilter}
            onChange={(event) => handleStatusFilterChange(event.target.value)}
          >
            <option value="">{DELEGATION_HISTORY_MESSAGES.STATUS_FILTER_ALL}</option>
            <option value="PENDING">Bekliyor</option>
            <option value="PENDING_STUDENT_APPROVAL">Öğrenci Onayı Bekleniyor</option>
            <option value="ACCEPTED">Kabul Edildi</option>
            <option value="REJECTED">Reddedildi</option>
            <option value="STUDENT_REJECTED">Öğrenci Reddetti</option>
            <option value="EXPIRED">Süresi Doldu</option>
          </select>

          <input
            type="date"
            className={FORM_FIELD_CLASS}
            aria-label={DELEGATION_HISTORY_MESSAGES.DATE_FROM}
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />

          <input
            type="date"
            className={FORM_FIELD_CLASS}
            aria-label={DELEGATION_HISTORY_MESSAGES.DATE_TO}
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loading label={DELEGATION_HISTORY_MESSAGES.LOADING} />
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
              history
            </span>
            <h2 className="mt-3 font-headline-md text-headline-md text-on-background">
              {DELEGATION_HISTORY_MESSAGES.EMPTY_TITLE}
            </h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {DELEGATION_HISTORY_MESSAGES.EMPTY_DESCRIPTION}
            </p>
          </div>
        ) : filteredDelegations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {DELEGATION_HISTORY_MESSAGES.EMPTY_FILTER}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/40">
                  {[
                    'Durum',
                    'Akademisyen',
                    'Asistan',
                    'Ders',
                    'Kategori',
                    'Tarih',
                    'Saat',
                    'Görüşme Türü',
                    'Oluşturulma',
                    'Son Güncelleme',
                  ].map((label) => (
                    <th
                      key={label}
                      className="px-5 py-4 text-left font-label-md text-label-md font-semibold text-on-surface-variant"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDelegations.map((delegation) => (
                  <tr
                    key={delegation.delegationId}
                    className="border-b border-outline-variant/40 transition-colors hover:bg-surface-container/30"
                  >
                    <td className="px-5 py-4">
                      <DelegationStatusBadge status={delegation.delegationStatus} />
                    </td>
                    <td className="px-5 py-4 font-label-md text-label-md font-semibold text-on-background">
                      {delegation.delegatedByUserName ?? '-'}
                    </td>
                    <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                      {delegation.delegatedToUserName ?? '-'}
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
                    <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                      {formatDateTime(delegation.updatedAt ?? delegation.delegatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
