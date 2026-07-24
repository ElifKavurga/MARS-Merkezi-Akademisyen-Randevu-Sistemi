import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HodAcademicianListDto } from '../types/hod';
import { hodService } from '../services/hodService';
import { hodAcademicianDetailPath } from '../constants/routes';
import { getInitials } from '../utils/userDisplay';
import Loading from '../components/Loading';

export default function HodAcademiciansPage() {
  const [academicians, setAcademicians] = useState<HodAcademicianListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAcademicians = async () => {
      try {
        setLoading(true);
        const data = await hodService.getDepartmentAcademicians();
        setAcademicians(data);
      } catch {
        setError('Akademisyen listesi yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    void fetchAcademicians();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <Loading variant="page" label="Akademisyenler yükleniyor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <div className="rounded-xl border border-error/30 bg-error-container/10 p-8 text-center">
          <span className="material-symbols-outlined mb-2 text-4xl text-error">error</span>
          <p className="font-body-lg text-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Akademisyenler
        </h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Bölümünüzdeki akademisyenleri ve güncel randevu istatistiklerini görüntüleyin.
        </p>
      </div>

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
              {academicians.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <span className="material-symbols-outlined mb-2 block text-4xl text-on-surface-variant">
                      group
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Bölümünüzde akademisyen bulunmamaktadır.
                    </p>
                  </td>
                </tr>
              ) : (
                academicians.map((academician) => (
                  <tr
                    key={academician.userId}
                    className="border-b border-outline-variant/20 last:border-0 transition-colors hover:bg-surface-container-low/60"
                  >
                    {/* Avatar + Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container font-label-md text-label-md font-semibold text-primary"
                          aria-hidden="true"
                        >
                          {getInitials(academician.fullName) || '?'}
                        </div>
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
