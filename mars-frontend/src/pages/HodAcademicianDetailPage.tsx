import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import HodPageHeader from '../components/HodPageHeader';
import Loading from '../components/Loading';
import UserAvatar from '../components/UserAvatar';
import { BarChart, DoughnutChart, LineChart } from '../components/charts';
import { getAppointmentStatusLabel, getMeetingTypeLabel } from '../constants/appointment';
import { hodService } from '../services/hodService';
import type {
  HodAcademicianDetailDto,
  HodDepartmentStatsDto,
  HodPerformanceSummaryDto,
  HodRecentAppointmentDto,
} from '../types/hod';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekleyen',
  APPROVED: 'Onaylanan',
  REJECTED: 'Reddedilen',
  COMPLETED: 'Tamamlanan',
  NO_SHOW: 'No-Show',
  CANCELLED: 'İptal',
};

const STATUS_CODES_BY_LABEL = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([status, label]) => [label, status]),
);

const STATUS_COLORS = ['#f59e0b', '#6366f1', '#ef4444', '#10b981', '#64748b', '#ec4899'];

type DrillDownState = {
  chart: 'weekly' | 'monthly' | 'status' | 'category';
  label: string;
};

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
    <div className="flex h-full min-h-[92px] gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent ?? 'bg-surface-container'}`}>
        <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden="true">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
        <p className="mt-1 font-headline-md text-headline-md leading-tight text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-on-surface-variant" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
        <p className="mt-0.5 break-words font-body-md text-body-md text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">{icon}</span>
        <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
      </div>
      <div className="flex flex-1 flex-col justify-end">
        {children}
      </div>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3">
      <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline-sm text-headline-sm text-primary">{value}</p>
    </div>
  );
}

function AppointmentRows({ appointments }: { appointments: HodRecentAppointmentDto[] }) {
  if (appointments.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="p-0">
          <EmptyState
            icon="event_busy"
            title="Randevu Yok"
            message="Bu görünümde listelenecek randevu bulunmamaktadır."
          />
        </td>
      </tr>
    );
  }

  return (
    <>
      {appointments.map((app) => (
        <tr key={app.appointmentId} className="hover:bg-surface-container-lowest/50">
          <td className="px-4 py-3">
            <div className="font-medium text-on-surface">{app.date}</div>
            <div className="text-body-sm text-on-surface-variant">{app.startTime} - {app.endTime}</div>
          </td>
          <td className="px-4 py-3 text-on-surface">{app.studentName}</td>
          <td className="px-4 py-3">
            <span className="inline-flex items-center rounded-full bg-primary-container/30 px-2.5 py-1 text-label-sm font-medium text-primary">
              {app.categoryName}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="text-on-surface">{getMeetingTypeLabel(app.meetingType)}</div>
            <div className="text-body-sm text-on-surface-variant">{app.durationMinutes} dk</div>
          </td>
          <td className="px-4 py-3">
            <span className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-1 text-label-sm font-medium text-on-surface">
              {getAppointmentStatusLabel(app.status)}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function HodAcademicianDetailPage() {
  const { id: userIdParam } = useParams<{ id: string }>();

  const [academician, setAcademician] = useState<HodAcademicianDetailDto | null>(null);
  const [performance, setPerformance] = useState<HodPerformanceSummaryDto | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<HodRecentAppointmentDto[]>([]);
  const [stats, setStats] = useState<HodDepartmentStatsDto | null>(null);
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = Number(userIdParam);

  const loadDetail = useCallback(async () => {
    if (!Number.isInteger(userId) || userId < 1) {
      setError('Geçersiz akademisyen kimliği.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setDrillDown(null);
    try {
      const [detailData, perfData, recentData, statsData] = await Promise.all([
        hodService.getAcademicianDetail(userId),
        hodService.getAcademicianPerformance(userId),
        hodService.getAcademicianRecentAppointments(userId),
        hodService.getAcademicianStats(userId),
      ]);
      setAcademician(detailData);
      setPerformance(perfData);
      setRecentAppointments(recentData);
      setStats(statsData);
    } catch {
      setError('Akademisyen bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const weeklyData = stats?.weeklyTrend.map((d) => ({ label: d.date, value: d.count })) ?? [];
  const monthlyData = stats?.monthlyTrend.map((d) => ({ label: d.yearMonth, value: d.count })) ?? [];
  const categoryData = stats?.categoryDistribution.map((d) => ({ label: d.categoryName, value: d.count })) ?? [];
  const statusData = stats?.statusDistribution.map((d, i) => ({
    label: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    color: STATUS_COLORS[i % STATUS_COLORS.length],
  })) ?? [];

  const drillDownAppointments = useMemo(() => {
    if (!drillDown) {
      return [];
    }

    return recentAppointments.filter((appointment) => {
      if (drillDown.chart === 'status') {
        return appointment.status === (STATUS_CODES_BY_LABEL[drillDown.label] ?? drillDown.label);
      }
      if (drillDown.chart === 'category') {
        return appointment.categoryName === drillDown.label;
      }
      if (drillDown.chart === 'weekly') {
        return appointment.date === drillDown.label;
      }
      return appointment.date.startsWith(drillDown.label);
    });
  }, [drillDown, recentAppointments]);

  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <Loading variant="page" label="Akademisyen bilgileri yükleniyor..." />
      </div>
    );
  }

  if (error || !academician) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <HodPageHeader title="Hata" description="" />
        <ErrorState
          icon="person_off"
          title="Akademisyen Bulunamadı"
          message={error ?? 'Bu akademisyen mevcut bölümünüzde bulunmamaktadır.'}
          onRetry={() => void loadDetail()}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 animate-fade-in pb-8">
      <HodPageHeader
        title="Akademisyen Detayı"
        description="Bölümünüzdeki akademisyenin profil ve randevu bilgileri."
      />

      <section className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm lg:col-span-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <UserAvatar fullName={academician.fullName} size="xl" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="font-headline-md text-headline-md text-on-background">{academician.fullName}</h2>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {academician.academicTitle?.trim() ? academician.academicTitle : 'Unvan belirtilmemiş'}
              </p>
              <div className="mt-3 divide-y divide-outline-variant/30">
                <InfoRow icon="school" label="Bölüm" value={academician.departmentName} />
                <InfoRow icon="mail" label="Kurumsal E-posta" value={academician.institutionalEmail} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">bar_chart</span>
            <h2 className="font-headline-md text-headline-md text-primary">İstatistikler</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiCard icon="event_available" label="Toplam Randevu" value={academician.totalAppointmentsCount} accent="bg-surface-container-high" />
            <KpiCard icon="pending" label="Bekleyen Randevu" value={academician.pendingAppointmentsCount} accent="bg-amber-100 text-amber-700" />
            <KpiCard icon="today" label="Bugünkü Randevu" value={academician.todayAppointmentsCount} accent="bg-surface-container-high" />
            <KpiCard icon="schedule" label="Aktif Ofis Saati" value={academician.activeOfficeHoursCount} accent="bg-surface-container-high" />
          </div>
        </div>
      </section>

      {stats ? (
        <section className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">analytics</span>
            <h2 className="font-headline-md text-headline-md text-primary">Performans Grafikleri</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Haftalık Randevu Yoğunluğu" icon="show_chart">
              <p className="-mt-1 font-body-sm text-body-sm text-on-surface-variant">Son 7 günlük kişisel randevu sayısı</p>
              <LineChart data={weeklyData} onClick={(label) => setDrillDown({ chart: 'weekly', label })} />
            </ChartCard>

            <ChartCard title="Aylık Randevu Dağılımı" icon="bar_chart">
              <p className="-mt-1 font-body-sm text-body-sm text-on-surface-variant">Son 12 aylık kişisel randevu sayısı</p>
              <BarChart data={monthlyData} onClick={(label) => setDrillDown({ chart: 'monthly', label })} />
            </ChartCard>

            <ChartCard title="Randevu Durum Dağılımı" icon="donut_large">
              <p className="-mt-1 font-body-sm text-body-sm text-on-surface-variant">Randevuların mevcut duruma göre dağılımı</p>
              <DoughnutChart data={statusData} onClick={(label) => setDrillDown({ chart: 'status', label })} />
            </ChartCard>

            <ChartCard title="Randevu Kategori Dağılımı" icon="category">
              <p className="-mt-1 font-body-sm text-body-sm text-on-surface-variant">Kategori bazlı toplam randevu sayıları</p>
              <BarChart data={categoryData} onClick={(label) => setDrillDown({ chart: 'category', label })} />
            </ChartCard>
          </div>
        </section>
      ) : null}

      {drillDown ? (
        <section className="mb-4 rounded-lg border border-primary/20 bg-surface-container-lowest p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">{drillDown.label} kayıtları</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Grafik seçimine göre görüntülenen randevu kayıtları
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container"
              onClick={() => setDrillDown(null)}
            >
              Temizle
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-outline-variant/40">
            <table className="w-full text-left font-body-md">
              <thead className="border-b border-outline-variant/40 bg-surface-container-lowest text-label-md text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-medium">Tarih / Saat</th>
                  <th className="px-4 py-3 font-medium">Öğrenci</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Tür / Süre</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                <AppointmentRows appointments={drillDownAppointments} />
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {performance ? (
        <section className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">speed</span>
            <h2 className="font-headline-md text-headline-md text-primary">Analizler</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard icon="task_alt" label="Tamamlanan" value={performance.totalCompleted} accent="bg-green-100 text-green-700" />
            <KpiCard icon="trending_up" label="Günlük Ortalama" value={performance.averageDaily} accent="bg-blue-100 text-blue-700" />
            <KpiCard icon="person_cancel" label="No-Show Sayısı" value={performance.noShowCount} accent="bg-red-100 text-red-700" />
            <KpiCard icon="pie_chart" label="No-Show Oranı (%)" value={performance.noShowRate} accent="bg-orange-100 text-orange-700" />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <CompactMetric label="Ortalama Cevap Süresi" value={performance.averageResponseTime} />
            <CompactMetric label="En Yoğun Gün" value={performance.busiestDay} />
            <CompactMetric label="En Yoğun Saat" value={performance.busiestTimeRange} />
          </div>
        </section>
      ) : null}

      <section className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">history</span>
          <h2 className="font-headline-md text-headline-md text-primary">Son Randevular</h2>
        </div>

        <div className="overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md">
              <thead className="border-b border-outline-variant/40 bg-surface-container-lowest text-label-md text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-medium">Tarih / Saat</th>
                  <th className="px-4 py-3 font-medium">Öğrenci</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Tür / Süre</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                <AppointmentRows appointments={recentAppointments} />
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
