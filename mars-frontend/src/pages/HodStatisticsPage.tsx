import { useCallback, useEffect, useState } from 'react';
import type { HodDepartmentKpiDto } from '../types/hod';
import { hodService } from '../services/hodService';
import Loading from '../components/Loading';

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ?? 'bg-surface-container'}`}>
        <span className="material-symbols-outlined text-[22px] text-primary">{icon}</span>
      </div>
      <div>
        <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
        <p className="mt-0.5 font-headline-md text-headline-md text-on-surface">{value}</p>
      </div>
    </div>
  );
}

export default function HodStatisticsPage() {
  const [kpi, setKpi] = useState<HodDepartmentKpiDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadKpi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hodService.getDepartmentKpiStats();
      setKpi(data);
    } catch {
      setError('İstatistikler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKpi();
  }, [loadKpi]);

  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <Loading variant="page" label="İstatistikler yükleniyor..." />
      </div>
    );
  }

  if (error || !kpi) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <div className="rounded-xl border border-error/30 bg-error-container/10 p-8 text-center">
          <span className="material-symbols-outlined mb-3 text-5xl text-error">error</span>
          <p className="font-headline-md text-headline-md text-error">Hata</p>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{error}</p>
          <button
            type="button"
            onClick={() => void loadKpi()}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-outline-variant px-5 py-2.5 font-label-md text-label-md text-primary transition-colors hover:bg-primary/5 hover:border-primary/40"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Bölüm İstatistikleri
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Bölümünüze ait genel KPI kartlarını inceleyin.
        </p>
      </div>

      <section className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">
            groups
          </span>
          <h2 className="font-headline-md text-headline-md text-primary">Akademisyenler</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon="school"
            label="Toplam Akademisyen"
            value={kpi.totalAcademicians}
            accent="bg-surface-container-high"
          />
          <KpiCard
            icon="person_check"
            label="Aktif Akademisyen"
            value={kpi.activeAcademicians}
            accent="bg-green-50 border border-green-200 text-green-700"
          />
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">
            event
          </span>
          <h2 className="font-headline-md text-headline-md text-primary">Randevular</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon="event_note"
            label="Toplam Randevu"
            value={kpi.totalAppointments}
            accent="bg-surface-container-high"
          />
          <KpiCard
            icon="today"
            label="Bugünkü Randevu"
            value={kpi.todayAppointments}
            accent="bg-blue-50 border border-blue-200 text-blue-700"
          />
          <KpiCard
            icon="pending_actions"
            label="Bekleyen Randevu"
            value={kpi.pendingAppointments}
            accent="bg-amber-50 border border-amber-200 text-amber-700"
          />
          <KpiCard
            icon="task_alt"
            label="Tamamlanan Randevu"
            value={kpi.completedAppointments}
            accent="bg-green-50 border border-green-200 text-green-700"
          />
          <KpiCard
            icon="person_cancel"
            label="No-Show Sayısı"
            value={kpi.noShowCount}
            accent="bg-red-50 border border-red-200 text-red-700"
          />
          <KpiCard
            icon="group_add"
            label="Bekleme Listesi (Öğrenci)"
            value={kpi.waitlistStudentCount}
            accent="bg-purple-50 border border-purple-200 text-purple-700"
          />
        </div>
      </section>
    </div>
  );
}
