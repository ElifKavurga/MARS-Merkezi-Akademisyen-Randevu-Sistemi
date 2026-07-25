import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { HodAcademicianDetailDto } from '../types/hod';
import { hodService } from '../services/hodService';
import { ROUTES } from '../constants/routes';
import { getAppointmentStatusLabel, getMeetingTypeLabel } from '../constants/appointment';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import HodPageHeader from '../components/HodPageHeader';
import UserAvatar from '../components/UserAvatar';

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

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-on-surface-variant">{icon}</span>
      <div className="min-w-0">
        <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
        <p className="mt-0.5 break-words font-body-md text-body-md text-on-surface">{value}</p>
      </div>
    </div>
  );
}

export default function HodAcademicianDetailPage() {
  const { id: userIdParam } = useParams<{ id: string }>();

  const [academician, setAcademician] = useState<HodAcademicianDetailDto | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
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
    try {
      const [detailData, perfData, recentData] = await Promise.all([
        hodService.getAcademicianDetail(userId),
        hodService.getAcademicianPerformance(userId),
        hodService.getAcademicianRecentAppointments(userId)
      ]);
      setAcademician(detailData);
      setPerformance(perfData);
      setRecentAppointments(recentData);
    } catch {
      setError('Akademisyen bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

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
        <HodPageHeader 
          title="Hata" 
          description=""
          backAction={{ label: 'Akademisyenler Listesi', to: ROUTES.HOD_ACADEMICIANS }} 
        />
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
    <div className="w-full min-w-0 animate-fade-in pb-12">
      <HodPageHeader 
        title="Akademisyen Detayı" 
        description="Bölümünüzdeki akademisyenin profil ve randevu bilgileri."
        backAction={{ label: 'Akademisyenler Listesi', to: ROUTES.HOD_ACADEMICIANS }} 
      />

      <section className="mb-6 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <UserAvatar fullName={academician.fullName} size="xl" />
          <div className="min-w-0 flex-1 text-center md:text-left">
            <h2 className="font-headline-lg text-headline-lg text-on-background">
              {academician.fullName}
            </h2>
            <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
              {academician.academicTitle?.trim() ? academician.academicTitle : 'Unvan belirtilmemiş'}
            </p>

            <div className="mt-5 divide-y divide-outline-variant/30">
              <InfoRow icon="school" label="Bölüm" value={academician.departmentName} />
              <InfoRow icon="mail" label="Kurumsal E-posta" value={academician.institutionalEmail} />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">
            bar_chart
          </span>
          <h2 className="font-headline-md text-headline-md text-primary">İstatistikler</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon="event_available"
            label="Toplam Randevu"
            value={academician.totalAppointmentsCount}
            accent="bg-surface-container-high"
          />
          <KpiCard
            icon="pending"
            label="Bekleyen Randevu"
            value={academician.pendingAppointmentsCount}
            accent="bg-amber-100 text-amber-700"
          />
          <KpiCard
            icon="today"
            label="Bugünkü Randevu"
            value={academician.todayAppointmentsCount}
            accent="bg-surface-container-high"
          />
          <KpiCard
            icon="schedule"
            label="Aktif Ofis Saati"
            value={academician.activeOfficeHoursCount}
            accent="bg-surface-container-high"
          />
        </div>
      </section>

      {performance && (
        <section className="mb-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">
              speed
            </span>
            <h2 className="font-headline-md text-headline-md text-primary">Performans Özeti</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon="task_alt"
              label="Tamamlanan"
              value={performance.totalCompleted}
              accent="bg-green-100 text-green-700"
            />
            <KpiCard
              icon="trending_up"
              label="Günlük Ortalama"
              value={performance.averageDaily}
              accent="bg-blue-100 text-blue-700"
            />
            <KpiCard
              icon="person_cancel"
              label="No-Show Sayısı"
              value={performance.noShowCount}
              accent="bg-red-100 text-red-700"
            />
            <KpiCard
              icon="pie_chart"
              label="No-Show Oranı (%)"
              value={performance.noShowRate}
              accent="bg-orange-100 text-orange-700"
            />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 flex flex-col gap-2">
              <span className="font-label-md text-on-surface-variant">Ortalama Cevap Süresi</span>
              <span className="font-headline-sm text-primary">{performance.averageResponseTime}</span>
            </div>
            <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 flex flex-col gap-2">
              <span className="font-label-md text-on-surface-variant">En Yoğun Gün</span>
              <span className="font-headline-sm text-primary">{performance.busiestDay}</span>
            </div>
            <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 flex flex-col gap-2">
              <span className="font-label-md text-on-surface-variant">En Yoğun Saat</span>
              <span className="font-headline-sm text-primary">{performance.busiestTimeRange}</span>
            </div>
          </div>
        </section>
      )}

      <section className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">
            history
          </span>
          <h2 className="font-headline-md text-headline-md text-primary">Son Randevular</h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md">
              <thead className="border-b border-outline-variant/40 bg-surface-container-lowest text-label-md text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4 font-medium">Tarih / Saat</th>
                  <th className="px-6 py-4 font-medium">Öğrenci</th>
                  <th className="px-6 py-4 font-medium">Kategori</th>
                  <th className="px-6 py-4 font-medium">Tür / Süre</th>
                  <th className="px-6 py-4 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <EmptyState 
                        icon="event_busy"
                        title="Randevu Yok"
                        message="Bu akademisyenin yakın zamanda gerçekleşmiş bir randevusu bulunmamaktadır."
                      />
                    </td>
                  </tr>
                ) : 
                  recentAppointments.map((app) => (
                    <tr key={app.appointmentId} className="hover:bg-surface-container-lowest/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-on-surface">{app.date}</div>
                        <div className="text-body-sm text-on-surface-variant">{app.startTime} - {app.endTime}</div>
                      </td>
                      <td className="px-6 py-4 text-on-surface">{app.studentName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-primary-container/30 px-2.5 py-1 text-label-sm font-medium text-primary">
                          {app.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-on-surface">{getMeetingTypeLabel(app.meetingType)}</div>
                        <div className="text-body-sm text-on-surface-variant">{app.durationMinutes} dk</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-1 text-label-sm font-medium text-on-surface">
                          {getAppointmentStatusLabel(app.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
    </div>
  );
}
