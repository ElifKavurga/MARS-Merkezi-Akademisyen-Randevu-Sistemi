import { useCallback, useEffect, useState } from 'react';
import type { HodDepartmentKpiDto, HodDepartmentStatsDto, HodDepartmentAnalysisDto, HodAcademicianListDto, HodPerformanceSummaryDto } from '../types/hod';
import { hodService } from '../services/hodService';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import HodPageHeader from '../components/HodPageHeader';
import ModalShell from '../components/ModalShell';
import ModalHeader from '../components/ModalHeader';
import { LineChart, BarChart, DoughnutChart } from '../components/charts';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { getAppointmentStatusLabel } from '../constants/appointment';

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  accent,
  onClick,
}: {
  icon: string;
  label: string;
  value: number;
  accent?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]' : ''}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ?? 'bg-surface-container'}`}>
        <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
      </div>
      <div className="mt-1">
        <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        <p className="font-headline-sm text-headline-sm text-on-surface font-semibold">{value}</p>
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


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HodStatisticsPage() {
  const [academicians, setAcademicians] = useState<HodAcademicianListDto[]>([]);
  const [selectedAcademicianId, setSelectedAcademicianId] = useState<number | null>(null);
  
  const [kpi, setKpi] = useState<HodDepartmentKpiDto | null>(null);
  const [stats, setStats] = useState<HodDepartmentStatsDto | null>(null);
  const [analysis, setAnalysis] = useState<HodDepartmentAnalysisDto | null>(null);
  const [academicianPerformance, setAcademicianPerformance] = useState<HodPerformanceSummaryDto | null>(null);
  const [academicianStatsMap, setAcademicianStatsMap] = useState<Record<number, HodDepartmentStatsDto>>({});
  
  const [drillDown, setDrillDown] = useState<{ chart: string; label: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (selectedAcademicianId === null) {
        // Fetch Department Geneli
        const [kpiData, statsData, analysisData, academiciansData] = await Promise.all([
          hodService.getDepartmentKpiStats(),
          hodService.getDepartmentStats(),
          hodService.getDepartmentAnalysis(),
          hodService.getDepartmentAcademicians(),
        ]);
        
        // Fetch all individual academicians' stats concurrently for Drill-Down
        const individualStatsPromises = academiciansData.map(async (ac) => {
          try {
            const st = await hodService.getAcademicianStats(ac.userId);
            return { id: ac.userId, stats: st };
          } catch {
            return null; // Ignore errors for individual stats to not break the page
          }
        });
        const individualStatsResults = await Promise.all(individualStatsPromises);
        const statsMap: Record<number, HodDepartmentStatsDto> = {};
        for (const res of individualStatsResults) {
          if (res) statsMap[res.id] = res.stats;
        }

        setKpi(kpiData);
        setStats(statsData);
        setAnalysis(analysisData);
        setAcademicians(academiciansData);
        setAcademicianStatsMap(statsMap);
        setAcademicianPerformance(null);
      } else {
        // Fetch specific Academician stats
        const [statsData, performanceData] = await Promise.all([
          hodService.getAcademicianStats(selectedAcademicianId),
          hodService.getAcademicianPerformance(selectedAcademicianId)
        ]);
        setStats(statsData);
        setAcademicianPerformance(performanceData);
      }
    } catch {
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [selectedAcademicianId]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <Loading variant="page" label="İstatistikler yükleniyor..." />
      </div>
    );
  }

  if (error || !stats || (selectedAcademicianId === null && (!kpi || !analysis))) {
    return <ErrorState message={error ?? 'Veriler yüklenemedi.'} onRetry={() => void loadData()} />;
  }

  // Define colors exactly here or in a constant file if needed.
  const STATUS_COLORS = ['#f59e0b', '#6366f1', '#ef4444', '#10b981', '#64748b', '#ec4899'];

  // Prepare chart data
  const weeklyData = stats.weeklyTrend.map(d => ({ label: d.date, value: d.count }));
  const monthlyData = stats.monthlyTrend.map(d => ({ label: d.yearMonth, value: d.count }));
  const categoryData = stats.categoryDistribution.map(d => ({ label: d.categoryName, value: d.count }));
  const statusData = stats.statusDistribution.map((d, i) => ({
    label: getAppointmentStatusLabel(d.status),
    value: d.count,
    color: STATUS_COLORS[i % STATUS_COLORS.length],
  }));

  // Handle Drill Down Click
  const handleChartClick = (chart: string, label: string) => {
    if (selectedAcademicianId === null) {
      setDrillDown({ chart, label });
    }
  };

  // Calculate Drill Down Breakdown
  let drillDownBreakdown: Array<{ name: string; count: number }> = [];
  if (drillDown && selectedAcademicianId === null) {
    drillDownBreakdown = academicians
      .map(ac => {
        const acStats = academicianStatsMap[ac.userId];
        if (!acStats) return { name: ac.fullName, count: 0 };
        
        let count = 0;
        if (drillDown.chart === 'status') {
          count = acStats.statusDistribution.find(s => getAppointmentStatusLabel(s.status) === drillDown.label)?.count || 0;
        } else if (drillDown.chart === 'category') {
          count = acStats.categoryDistribution.find(c => c.categoryName === drillDown.label)?.count || 0;
        } else if (drillDown.chart === 'weekly') {
          count = acStats.weeklyTrend.find(d => d.date === drillDown.label)?.count || 0;
        } else if (drillDown.chart === 'monthly') {
          count = acStats.monthlyTrend.find(d => d.yearMonth === drillDown.label)?.count || 0;
        }
        return { name: ac.fullName, count };
      })
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  return (
    <div className="w-full min-w-0 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <HodPageHeader 
          title="Bölüm İstatistikleri" 
          description="Bölümünüze veya belirli bir akademisyene ait performans ve randevu istatistiklerini inceleyin."
        />
        <div className="flex flex-col gap-1.5 shrink-0 sm:w-64">
          <label htmlFor="academician-filter" className="text-sm font-medium text-on-surface-variant">Akademisyen Analizi</label>
          <select
            id="academician-filter"
            className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedAcademicianId ?? ''}
            onChange={(e) => setSelectedAcademicianId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Tüm Akademisyenler</option>
            {academicians.map((ac) => (
              <option key={ac.userId} value={ac.userId}>
                {ac.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedAcademicianId === null && kpi ? (
        <>
          {/* KPI – Academicians */}
          <section className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">groups</span>
              <h2 className="font-headline-md text-headline-md text-primary">Akademisyenler</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard icon="school" label="Toplam Akademisyen" value={kpi.totalAcademicians} accent="bg-surface-container-high" onClick={() => navigate(ROUTES.HOD_ACADEMICIANS)} />
              <KpiCard icon="person_check" label="Aktif Akademisyen" value={kpi.activeAcademicians} accent="bg-green-50 border border-green-200" onClick={() => navigate(`${ROUTES.HOD_ACADEMICIANS}?filter=active`)} />
            </div>
          </section>

          {/* KPI – Appointments */}
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">event</span>
              <h2 className="font-headline-md text-headline-md text-primary">Randevular</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard icon="event_note" label="Toplam Randevu" value={kpi.totalAppointments} accent="bg-surface-container-high" onClick={() => navigate(`${ROUTES.HOD_ACADEMICIANS}?filter=total`)} />
              <KpiCard icon="today" label="Bugünkü Randevu" value={kpi.todayAppointments} accent="bg-surface-container-high" onClick={() => navigate(`${ROUTES.HOD_ACADEMICIANS}?filter=today`)} />
              <KpiCard icon="pending" label="Bekleyen Randevu" value={kpi.pendingAppointments} accent="bg-amber-100 border border-amber-200 text-amber-700" onClick={() => navigate(`${ROUTES.HOD_ACADEMICIANS}?filter=pending`)} />
              <KpiCard icon="task_alt" label="Tamamlanan Randevu" value={kpi.completedAppointments} accent="bg-green-100 border border-green-200 text-green-700" onClick={() => navigate(`${ROUTES.HOD_ACADEMICIANS}?filter=completed`)} />
              <KpiCard icon="person_cancel" label="No-Show Sayısı" value={kpi.noShowCount} accent="bg-red-100 border border-red-200 text-red-700" onClick={() => navigate(`${ROUTES.HOD_ACADEMICIANS}?filter=noshow`)} />
              <KpiCard icon="group_add" label="Bekleme Listesi" value={kpi.waitlistStudentCount} accent="bg-purple-100 border border-purple-200 text-purple-700" onClick={() => navigate(`${ROUTES.HOD_ACADEMICIANS}?filter=waitlist`)} />
            </div>
          </section>
        </>
      ) : academicianPerformance ? (
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">person</span>
            <h2 className="font-headline-md text-headline-md text-primary">Akademisyen Performansı</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon="task_alt" label="Tamamlanan" value={academicianPerformance.totalCompleted} accent="bg-green-100 border border-green-200 text-green-700" onClick={() => navigate(`${ROUTES.HOD_ACADEMICIANS}?filter=completed`)} />
            <KpiCard icon="person_cancel" label="No-Show" value={academicianPerformance.noShowCount} accent="bg-red-100 border border-red-200 text-red-700" onClick={() => navigate(`${ROUTES.HOD_ACADEMICIANS}?filter=noshow`)} />
            
            <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 border border-orange-200 text-orange-700">
                <span className="material-symbols-outlined text-[20px] text-primary">percent</span>
              </div>
              <div className="mt-1">
                <p className="font-label-sm text-label-sm text-on-surface-variant">No-Show Oranı</p>
                <p className="font-headline-sm text-headline-sm text-on-surface font-semibold">%{academicianPerformance.noShowRate}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 border border-blue-200 text-blue-700">
                <span className="material-symbols-outlined text-[20px] text-primary">avg_time</span>
              </div>
              <div className="mt-1">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Ort. Günlük</p>
                <p className="font-headline-sm text-headline-sm text-on-surface font-semibold">{academicianPerformance.averageDaily}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Charts */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">analytics</span>
          <h2 className="font-headline-md text-headline-md text-primary">Grafikler</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Weekly line chart */}
          <ChartCard title="Haftalık Randevu Yoğunluğu" icon="show_chart">
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Son 7 günlük {selectedAcademicianId ? 'kişisel' : 'bölüm geneli'} randevu sayısı</p>
            <LineChart data={weeklyData} onClick={selectedAcademicianId === null ? (label) => handleChartClick('weekly', label) : undefined} />
          </ChartCard>

          {/* Monthly bar chart */}
          <ChartCard title="Aylık Randevu Dağılımı" icon="bar_chart">
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Son 12 aylık {selectedAcademicianId ? 'kişisel' : 'bölüm geneli'} randevu sayısı</p>
            <BarChart data={monthlyData} onClick={selectedAcademicianId === null ? (label) => handleChartClick('monthly', label) : undefined} />
          </ChartCard>

          {/* Status doughnut */}
          <ChartCard title="Randevu Durum Dağılımı" icon="donut_large">
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Randevuların mevcut duruma göre dağılımı</p>
            <DoughnutChart data={statusData} onClick={selectedAcademicianId === null ? (label) => handleChartClick('status', label) : undefined} />
          </ChartCard>

          {/* Category bar chart */}
          <ChartCard title="Randevu Kategori Dağılımı" icon="category">
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Kategori bazlı toplam randevu sayıları</p>
            <BarChart data={categoryData} onClick={selectedAcademicianId === null ? (label) => handleChartClick('category', label) : undefined} />
          </ChartCard>
        </div>
      </section>

      {/* Analysis Sections (Only for Department) */}
      {selectedAcademicianId === null && analysis && (
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
      )}
      
      {/* Drill-Down Modal */}
      <ModalShell
        open={drillDown !== null}
        onClose={() => setDrillDown(null)}
        titleId="drill-down-title"
        maxWidthClass="sm:max-w-md"
      >
        <div className="flex justify-between items-start p-6 pb-0">
          <ModalHeader 
            titleId="drill-down-title"
            icon="analytics"
            title={`${drillDown?.label} Dağılımı`} 
            description="İlgili verinin akademisyenlere göre dağılımı"
          />
          <button type="button" onClick={() => setDrillDown(null)} className="text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 pt-0">
          {drillDownBreakdown.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {drillDownBreakdown.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center bg-surface-container-lowest border border-outline-variant/50 p-3 rounded-lg shadow-sm">
                  <span className="font-medium text-on-surface">{item.name}</span>
                  <span className="text-primary font-bold">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-on-surface-variant">
              Bu kritere uygun kayıt bulunamadı.
            </div>
          )}
        </div>
      </ModalShell>
    </div>
  );
}
