import { useCallback, useEffect, useState } from 'react';
import type { HodDepartmentKpiDto, HodDepartmentStatsDto, HodDepartmentAnalysisDto } from '../types/hod';
import { hodService } from '../services/hodService';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import HodPageHeader from '../components/HodPageHeader';

// ─── KPI Card ────────────────────────────────────────────────────────────────
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
    <div className="flex h-full min-h-[120px] flex-col gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent ?? 'bg-surface-container'}`}>
        <span className="material-symbols-outlined text-[24px] text-primary">{icon}</span>
      </div>
      <div className="mt-auto">
        <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
        <p className="mt-1 font-headline-md text-headline-md text-on-surface leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">{icon}</span>
        <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
      </div>
      <div className="mt-auto">
        {children}
      </div>
    </div>
  );
}

// ─── Analysis Card ────────────────────────────────────────────────────────────
function AnalysisCard({ title, icon, metrics }: { title: string; icon: string; metrics: { label: string; value: string | number; colSpan?: boolean }[] }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm h-full">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">{icon}</span>
        <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {metrics.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3 ${m.colSpan ? 'sm:col-span-2' : ''}`}>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{m.label}</span>
            <span className="font-title-md text-title-md text-on-surface">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Line Chart (SVG) ─────────────────────────────────────────────────────────
function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return <EmptyChart />;
  const W = 500, H = 160, padX = 30, padY = 20;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1 || 1)) * (W - padX * 2);
    const y = padY + (1 - d.value / maxVal) * (H - padY * 2);
    return { x, y, label: d.label, value: d.value };
  });
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = [
    `${points[0].x},${H - padY}`,
    ...points.map(p => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${H - padY}`,
  ].join(' ');

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }} aria-label="Çizgi grafik">
        {/* Area fill */}
        <polygon points={area} fill="rgba(var(--color-primary, 99,102,241), 0.08)" />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" strokeLinejoin="round" strokeLinecap="round" />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" className="fill-primary" />
            <title>{`${p.label}: ${p.value}`}</title>
          </g>
        ))}
        {/* X labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="9" className="fill-on-surface-variant" fontFamily="inherit">
            {p.label.slice(5)} {/* show MM-DD */}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Bar Chart (SVG) ──────────────────────────────────────────────────────────
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16', '#f97316', '#64748b', '#a78bfa', '#34d399'];

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return <EmptyChart />;
  const W = 500, H = 160, padX = 30, padY = 20, gap = 6;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = (W - padX * 2 - gap * (data.length - 1)) / data.length;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }} aria-label="Çubuk grafik">
        {data.map((d, i) => {
          const barH = ((d.value / maxVal) * (H - padY * 2));
          const x = padX + i * (barW + gap);
          const y = H - padY - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={BAR_COLORS[i % BAR_COLORS.length]} opacity="0.85">
                <title>{`${d.label}: ${d.value}`}</title>
              </rect>
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="inherit">
                {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Doughnut Chart (SVG) ────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekleyen',
  APPROVED: 'Onaylanan',
  REJECTED: 'Reddedilen',
  COMPLETED: 'Tamamlanan',
  NO_SHOW: 'No-Show',
  CANCELLED: 'İptal',
};
const STATUS_COLORS = ['#f59e0b', '#6366f1', '#ef4444', '#10b981', '#64748b', '#ec4899'];

function DoughnutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  if (data.length === 0 || data.every(d => d.value === 0)) return <EmptyChart />;
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 60, cx = 80, cy = 80, strokeWidth = 22;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg viewBox="0 0 160 160" className="w-40 h-40 shrink-0" aria-label="Halka grafik">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const dashOffset = circumference - offset * circumference;
          offset += pct;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={dashOffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="inherit">Toplam</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1e293b" fontFamily="inherit">{total}</text>
      </svg>
      <ul className="flex flex-col gap-1.5 text-sm">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-on-surface-variant">{d.label}</span>
            <span className="ml-auto font-medium text-on-surface">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
      <span className="material-symbols-outlined mb-2 text-4xl text-outline-variant">bar_chart</span>
      <p className="font-body-sm text-body-sm">Henüz veri bulunmuyor</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HodStatisticsPage() {
  const [kpi, setKpi] = useState<HodDepartmentKpiDto | null>(null);
  const [stats, setStats] = useState<HodDepartmentStatsDto | null>(null);
  const [analysis, setAnalysis] = useState<HodDepartmentAnalysisDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiData, statsData, analysisData] = await Promise.all([
        hodService.getDepartmentKpiStats(),
        hodService.getDepartmentStats(),
        hodService.getDepartmentAnalysis(),
      ]);
      setKpi(kpiData);
      setStats(statsData);
      setAnalysis(analysisData);
    } catch {
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <Loading variant="page" label="İstatistikler yükleniyor..." />
      </div>
    );
  }

  if (error || !kpi || !stats || !analysis) {
    return <ErrorState message={error ?? 'Veriler yüklenemedi.'} onRetry={() => void loadData()} />;
  }

  // Prepare chart data
  const weeklyData = stats.weeklyTrend.map(d => ({ label: d.date, value: d.count }));
  const monthlyData = stats.monthlyTrend.map(d => ({ label: d.yearMonth, value: d.count }));
  const categoryData = stats.categoryDistribution.map(d => ({ label: d.categoryName, value: d.count }));
  const statusData = stats.statusDistribution.map((d, i) => ({
    label: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    color: STATUS_COLORS[i % STATUS_COLORS.length],
  }));

  return (
    <div className="w-full min-w-0 animate-fade-in pb-12">
      <HodPageHeader 
        title="Bölüm İstatistikleri" 
        description="Bölümünüze ait genel KPI ve randevu istatistiklerini inceleyin."
      />

      {/* KPI – Academicians */}
      <section className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">groups</span>
          <h2 className="font-headline-md text-headline-md text-primary">Akademisyenler</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon="school" label="Toplam Akademisyen" value={kpi.totalAcademicians} accent="bg-surface-container-high" />
          <KpiCard icon="person_check" label="Aktif Akademisyen" value={kpi.activeAcademicians} accent="bg-green-50 border border-green-200" />
        </div>
      </section>

      {/* KPI – Appointments */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">event</span>
          <h2 className="font-headline-md text-headline-md text-primary">Randevular</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon="event_note" label="Toplam Randevu" value={kpi.totalAppointments} accent="bg-surface-container-high" />
          <KpiCard icon="today" label="Bugünkü Randevu" value={kpi.todayAppointments} accent="bg-blue-50 border border-blue-200" />
          <KpiCard icon="pending_actions" label="Bekleyen Randevu" value={kpi.pendingAppointments} accent="bg-amber-50 border border-amber-200" />
          <KpiCard icon="task_alt" label="Tamamlanan Randevu" value={kpi.completedAppointments} accent="bg-green-50 border border-green-200" />
          <KpiCard icon="person_cancel" label="No-Show Sayısı" value={kpi.noShowCount} accent="bg-red-50 border border-red-200" />
          <KpiCard icon="group_add" label="Bekleme Listesi" value={kpi.waitlistStudentCount} accent="bg-purple-50 border border-purple-200" />
        </div>
      </section>

      {/* Charts */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">analytics</span>
          <h2 className="font-headline-md text-headline-md text-primary">Grafikler</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Weekly line chart */}
          <ChartCard title="Haftalık Randevu Yoğunluğu" icon="show_chart">
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Son 7 günlük bölüm geneli randevu sayısı</p>
            <LineChart data={weeklyData} />
          </ChartCard>

          {/* Monthly bar chart */}
          <ChartCard title="Aylık Randevu Dağılımı" icon="bar_chart">
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Son 12 aylık bölüm geneli randevu sayısı</p>
            <BarChart data={monthlyData} />
          </ChartCard>

          {/* Status doughnut */}
          <ChartCard title="Randevu Durum Dağılımı" icon="donut_large">
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Randevuların mevcut duruma göre dağılımı</p>
            <DoughnutChart data={statusData} />
          </ChartCard>

          {/* Category bar chart */}
          <ChartCard title="Randevu Kategori Dağılımı" icon="category">
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Kategori bazlı toplam randevu sayıları</p>
            <BarChart data={categoryData} />
          </ChartCard>
        </div>
      </section>

      {/* Analysis Sections */}
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">insights</span>
          <h2 className="font-headline-md text-headline-md text-primary">Derinlemesine Analiz</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <AnalysisCard
            title="Genel Analiz"
            icon="monitoring"
            metrics={[
              { label: 'En Yoğun Akademisyen', value: analysis.generalAnalysis.busiestAcademician, colSpan: true },
              { label: 'Ort. Günlük', value: analysis.generalAnalysis.avgDailyAppointments.toFixed(1) },
              { label: 'Ort. Haftalık', value: analysis.generalAnalysis.avgWeeklyAppointments.toFixed(1) },
              { label: 'En Yoğun Kategori', value: analysis.generalAnalysis.busiestCategory, colSpan: true },
              { label: 'En Yoğun Gün', value: analysis.generalAnalysis.busiestDay },
              { label: 'En Yoğun Saat', value: analysis.generalAnalysis.busiestTimeRange },
            ]}
          />
          
          <AnalysisCard
            title="No-Show Analizi"
            icon="person_off"
            metrics={[
              { label: 'Toplam No-Show', value: analysis.noShowAnalysis.totalNoShow },
              { label: 'No-Show Oranı', value: `%${analysis.noShowAnalysis.noShowRate.toFixed(1)}` },
              { label: 'En Fazla (Gün)', value: analysis.noShowAnalysis.mostNoShowDay, colSpan: true },
              { label: 'En Fazla (Saat)', value: analysis.noShowAnalysis.mostNoShowTimeRange, colSpan: true },
            ]}
          />
          
          <AnalysisCard
            title="Bekleme Listesi Analizi"
            icon="hourglass_empty"
            metrics={[
              { label: 'Toplam Bekleyen', value: analysis.waitlistAnalysis.totalWaitlistStudents },
              { label: 'Randevuya Dönüşen', value: analysis.waitlistAnalysis.convertedToAppointmentCount },
              { label: 'Popüler Kategoriler', value: analysis.waitlistAnalysis.topWaitlistCategories.join(', ') || '-', colSpan: true },
              { label: 'Ort. Bekleme Süresi', value: analysis.waitlistAnalysis.averageWaitTime, colSpan: true },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
