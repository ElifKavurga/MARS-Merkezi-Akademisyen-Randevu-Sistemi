import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { HodAcademicianListDto } from '../types/hod';
import { hodService } from '../services/hodService';
import { hodAcademicianDetailPath } from '../constants/routes';

import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import HodPageHeader from '../components/HodPageHeader';
import UserAvatar from '../components/UserAvatar';

export default function HodAcademiciansPage() {
  const [academicians, setAcademicians] = useState<(HodAcademicianListDto & { 
    completedAppointmentsCount?: number; 
    noShowCount?: number; 
    waitlistCount?: number; 
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');

  useEffect(() => {
    const fetchAcademicians = async () => {
      try {
        setLoading(true);
        const data = await hodService.getDepartmentAcademicians();
        
        // Eğer filtre tamamlanan, noshow veya bekleme listesi ise, backend'den bireysel detayları (Performance & Stats) çek.
        if (filter === 'completed' || filter === 'noshow' || filter === 'waitlist') {
          const enrichedData = await Promise.all(
            data.map(async (ac) => {
              try {
                let completed = 0;
                let noshow = 0;
                let waitlist = 0;
                
                if (filter === 'completed' || filter === 'noshow') {
                  const perf = await hodService.getAcademicianPerformance(ac.userId);
                  completed = perf.totalCompleted;
                  noshow = perf.noShowCount;
                }
                
                if (filter === 'waitlist') {
                  const stats = await hodService.getAcademicianStats(ac.userId);
                  // Waitlist durumu genellikle WAITING veya BEKLEMEDE gibi bir statü ile statusDistribution içerisinde yer alabilir.
                  const waitlistStat = stats.statusDistribution.find(s => s.status === 'WAITING' || s.status === 'WAITLIST' || s.status === 'BEKLEYEN');
                  waitlist = waitlistStat ? waitlistStat.count : 0;
                }
                
                return {
                  ...ac,
                  completedAppointmentsCount: completed,
                  noShowCount: noshow,
                  waitlistCount: waitlist,
                };
              } catch {
                return { ...ac, completedAppointmentsCount: 0, noShowCount: 0, waitlistCount: 0 };
              }
            })
          );
          setAcademicians(enrichedData);
        } else {
          setAcademicians(data);
        }
      } catch {
        setError('Akademisyen listesi yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    void fetchAcademicians();
  }, [filter]);

  const filteredAcademicians = useMemo(() => {
    let result = [...academicians];
    if (filter === 'active') {
      result = result.filter(a => a.activeOfficeHoursCount > 0);
    } else if (filter === 'today') {
      result = result.filter(a => a.todayAppointmentsCount > 0).sort((a, b) => b.todayAppointmentsCount - a.todayAppointmentsCount);
    } else if (filter === 'pending') {
      result = result.filter(a => a.pendingAppointmentsCount > 0).sort((a, b) => b.pendingAppointmentsCount - a.pendingAppointmentsCount);
    } else if (filter === 'total') {
      result = result.filter(a => a.totalAppointmentsCount > 0).sort((a, b) => b.totalAppointmentsCount - a.totalAppointmentsCount);
    } else if (filter === 'completed') {
      result = result.filter(a => (a.completedAppointmentsCount ?? 0) > 0).sort((a, b) => (b.completedAppointmentsCount ?? 0) - (a.completedAppointmentsCount ?? 0));
    } else if (filter === 'noshow') {
      result = result.filter(a => (a.noShowCount ?? 0) > 0).sort((a, b) => (b.noShowCount ?? 0) - (a.noShowCount ?? 0));
    } else if (filter === 'waitlist') {
      result = result.filter(a => (a.waitlistCount ?? 0) > 0).sort((a, b) => (b.waitlistCount ?? 0) - (a.waitlistCount ?? 0));
    }
    return result;
  }, [academicians, filter]);

  const pageDescription = useMemo(() => {
    switch (filter) {
      case 'active':
        return 'Bu sayfada bölümünüzde aktif ofis saati bulunan akademisyenler listelenmektedir.';
      case 'today':
        return 'Bu sayfada bugün randevusu olan akademisyenler listelenmektedir.';
      case 'pending':
        return 'Bu sayfada bölümünüzde bekleyen randevuya sahip akademisyenler listelenmektedir.';
      case 'total':
        return 'Bu sayfada bölümünüzdeki tüm randevulara sahip akademisyenler listelenmektedir.';
      case 'completed':
        return 'Bu sayfada tamamlanan randevularınızla ilgili detaylı akademisyen listesi görüntülenmektedir.';
      case 'noshow':
        return 'Bu sayfada randevuya katılmama kayıtlarına sahip akademisyenler görüntülenmektedir.';
      case 'waitlist':
        return 'Bu sayfada bekleme listesinde öğrencisi olan akademisyenler listelenmektedir.';
      default:
        return 'Bölümünüzdeki akademisyenleri ve güncel randevu istatistiklerini görüntüleyin.';
    }
  }, [filter]);

  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <Loading variant="page" label="Akademisyenler yükleniyor..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void navigate(0)} />;
  }

  return (
    <div className="w-full min-w-0 animate-fade-in pb-12">
      <HodPageHeader 
        title="Akademisyenler" 
        description={pageDescription}
      />

      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low">
                <th className="py-3.5 px-5 font-label-md text-label-md font-medium text-on-surface-variant">
                  Akademisyen
                </th>
                <th className="py-3.5 px-5 font-label-md text-label-md font-medium text-on-surface-variant">
                  Unvan
                </th>
                <th className="py-3.5 px-5 font-label-md text-label-md font-medium text-on-surface-variant text-center">
                  Aktif Ofis Saati
                </th>
                <th className="py-3.5 px-5 font-label-md text-label-md font-medium text-on-surface-variant text-center">
                  Bugünkü Randevu
                </th>
                <th className="py-3.5 px-5 font-label-md text-label-md font-medium text-on-surface-variant text-center">
                  Bekleyen Randevu
                </th>
                <th className="py-3.5 px-5 font-label-md text-label-md font-medium text-on-surface-variant text-center">
                  Toplam Randevu
                </th>
                <th className="py-3.5 px-5 font-label-md text-label-md font-medium text-on-surface-variant text-right">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAcademicians.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState 
                      icon="group"
                      title="Akademisyen Bulunamadı"
                      message="Bölümünüzde belirtilen kriterlere uygun akademisyen bulunmamaktadır."
                    />
                  </td>
                </tr>
              ) : (
                filteredAcademicians.map((academician) => (
                  <tr
                    key={academician.userId}
                    className="border-b border-outline-variant/20 last:border-0 transition-colors hover:bg-surface-container-low/60"
                  >
                    {/* Avatar + Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <UserAvatar fullName={academician.fullName} size="sm" />
                        <span className="font-body-md text-body-md font-medium text-on-surface">
                          {academician.fullName}
                        </span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-4 px-5 font-body-md text-body-md text-on-surface-variant">
                      {academician.academicTitle?.trim() || (
                        <span className="text-outline italic">—</span>
                      )}
                    </td>

                    {/* Active Office Hours */}
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-md text-label-md font-medium text-on-surface">
                        {academician.activeOfficeHoursCount}
                      </span>
                    </td>

                    {/* Today's Appointments */}
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-md text-label-md font-medium text-on-surface">
                        {academician.todayAppointmentsCount}
                      </span>
                    </td>

                    {/* Pending – warning tone */}
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-flex min-w-[2rem] items-center justify-center rounded-full px-2.5 py-0.5 font-label-md text-label-md font-medium ${
                          academician.pendingAppointmentsCount > 0
                            ? 'border border-amber-200 bg-amber-100 text-amber-800'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {academician.pendingAppointmentsCount}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-4 px-5 text-center font-body-md text-body-md text-on-surface-variant font-medium">
                      {academician.totalAppointmentsCount}
                    </td>

                    {/* Detail Button */}
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(hodAcademicianDetailPath(academician.userId))}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface px-3.5 py-1.5 font-label-md text-label-md text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Detay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
