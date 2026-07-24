import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HodAcademicianListDto } from '../types/hod';
import { hodService } from '../services/hodService';
import { getInitials } from '../utils/userDisplay';
import Loading from '../components/Loading';

export default function HodAcademiciansPage() {
  const [academicians, setAcademicians] = useState<HodAcademicianListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAcademicians = async () => {
      try {
        setLoading(true);
        const data = await hodService.getDepartmentAcademicians();
        setAcademicians(data);
      } catch (err) {
        setError('Akademisyen listesi yüklenirken bir hata oluştu.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicians();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="w-full min-w-0 animate-fade-in">
        <div className="rounded-xl border border-error/40 bg-error-container/10 p-8 text-center text-error">
          <span className="material-symbols-outlined mb-2 text-4xl">error</span>
          <p className="font-body-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Akademisyenler
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Bölümünüzdeki akademisyenleri ve güncel randevu istatistiklerini görüntüleyin.
        </p>
      </div>

      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-label-lg">
                <th className="py-4 px-6 font-medium">Akademisyen</th>
                <th className="py-4 px-6 font-medium">Unvan</th>
                <th className="py-4 px-6 font-medium text-center">Aktif Ofis Saati</th>
                <th className="py-4 px-6 font-medium text-center">Bugünkü Randevular</th>
                <th className="py-4 px-6 font-medium text-center">Bekleyen Randevular</th>
                <th className="py-4 px-6 font-medium text-center">Toplam Randevu</th>
                <th className="py-4 px-6 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {academicians.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    Bölümünüzde akademisyen bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                academicians.map((academician) => (
                  <tr
                    key={academician.userId}
                    className="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container font-label-lg shadow-sm">
                          {getInitials(academician.fullName) || '?'}
                        </div>
                        <span className="font-body-lg text-on-surface font-medium">
                          {academician.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">
                      {academician.academicTitle || '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-full bg-surface-container-high px-2.5 py-0.5 text-on-surface font-medium">
                        {academician.activeOfficeHoursCount}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-full bg-surface-container-high px-2.5 py-0.5 text-on-surface font-medium">
                        {academician.todayAppointmentsCount}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[2.5rem] rounded-full px-2.5 py-0.5 font-medium ${
                          academician.pendingAppointmentsCount > 0
                            ? 'bg-tertiary-container text-on-tertiary-container'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {academician.pendingAppointmentsCount}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-on-surface-variant font-medium">
                      {academician.totalAppointmentsCount}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/academician/profile/${academician.userId}`}
                        className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 font-label-md text-primary transition-colors hover:bg-primary/10 hover:border-primary/30"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        Detay
                      </Link>
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
