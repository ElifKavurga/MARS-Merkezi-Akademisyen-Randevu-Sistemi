import { useCallback, useEffect, useRef, useState } from 'react';
import Loading from '../components/Loading';
import {
  getSchedulerStatuses,
  type SchedulerStatus,
} from '../services/adminSchedulerStatusService';

const AUTO_REFRESH_MS = 30_000;

const STATUS_CONFIG: Record<
  SchedulerStatus['status'],
  { label: string; dot: string; badge: string; border: string }
> = {
  SUCCESS: {
    label: 'Başarılı',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    border: 'border-emerald-200',
  },
  WARNING: {
    label: 'Uyarı',
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    border: 'border-amber-200',
  },
  FAILED: {
    label: 'Hata',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    border: 'border-rose-200',
  },
  RUNNING: {
    label: 'Çalışıyor',
    dot: 'bg-blue-500 animate-pulse',
    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    border: 'border-blue-200',
  },
};

const SCHEDULER_NAME_MAP: Record<string, string> = {
  AppointmentReminder: 'Randevu Hatırlatma Servisi',
  DelegationExpiry: 'Randevu Devri Süre Sonu Kontrolü',
  DelegationSync: 'Randevu Devri Senkronizasyonu',
  WaitlistOfferExpiry: 'Bekleme Listesi Teklif Süre Kontrolü',
};

function getSchedulerDisplayName(technicalName: string): string {
  return SCHEDULER_NAME_MAP[technicalName] || technicalName;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function MetricCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-semibold text-slate-800">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function SchedulerCard({ scheduler }: { scheduler: SchedulerStatus }) {
  const cfg = STATUS_CONFIG[scheduler.status] ?? STATUS_CONFIG.SUCCESS;
  return (
    <article
      className={`rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${cfg.border}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-800 leading-tight">
          {getSchedulerDisplayName(scheduler.schedulerName)}
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.badge}`}
        >
          <span className={`size-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Metrics */}
      <div className="mt-5 grid grid-cols-4 divide-x divide-slate-100 rounded-xl bg-slate-50 py-3">
        <MetricCell label="İşlenen" value={scheduler.processed} />
        <MetricCell label="Güncellenen" value={scheduler.updated} />
        <MetricCell label="Atlanan" value={scheduler.skipped} />
        <MetricCell label="Hatalı" value={scheduler.errors} />
      </div>

      {/* Timing */}
      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Son çalışma</dt>
          <dd className="font-mono text-slate-700 text-right">{formatDateTime(scheduler.lastRunAt)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Son başarılı</dt>
          <dd className="font-mono text-slate-700 text-right">{formatDateTime(scheduler.lastSuccessAt)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Süre</dt>
          <dd className="font-mono text-slate-700">{scheduler.durationMs} ms</dd>
        </div>
      </dl>
    </article>
  );
}

export default function AdminSchedulerStatusPage() {
  const [schedulers, setSchedulers] = useState<SchedulerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const data = await getSchedulerStatuses();
      setSchedulers(data);
      setLastRefreshed(new Date());
    } catch {
      setError('Scheduler durumları yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(true);
    intervalRef.current = setInterval(() => void fetchData(false), AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const successCount = schedulers.filter((s) => s.status === 'SUCCESS').length;
  const warnCount = schedulers.filter((s) => s.status === 'WARNING').length;
  const failCount = schedulers.filter((s) => s.status === 'FAILED').length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sistem Durumu</h1>
          
        </div>
        {lastRefreshed && (
          <p className="text-xs text-slate-400">
            Son güncelleme: {lastRefreshed.toLocaleTimeString('tr-TR')}
          </p>
        )}
      </div>

      {/* Summary bar */}
      {!loading && schedulers.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
            <span className="size-2 rounded-full bg-emerald-500" />
            {successCount} Başarılı
          </span>
          {warnCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
              <span className="size-2 rounded-full bg-amber-400" />
              {warnCount} Uyarı
            </span>
          )}
          {failCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
              <span className="size-2 rounded-full bg-rose-500" />
              {failCount} Hata
            </span>
          )}
        </div>
      )}

      {/* States */}
      {loading && <Loading />}

      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && schedulers.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300">monitor_heart</span>
          <p className="mt-3 text-sm text-slate-500">
            Henüz hiçbir scheduler çalışmamış. Veriler ilk çalışmadan sonra görünür.
          </p>
        </div>
      )}

      {!loading && !error && schedulers.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {schedulers.map((s) => (
            <SchedulerCard key={s.schedulerName} scheduler={s} />
          ))}
        </div>
      )}
    </div>
  );
}
