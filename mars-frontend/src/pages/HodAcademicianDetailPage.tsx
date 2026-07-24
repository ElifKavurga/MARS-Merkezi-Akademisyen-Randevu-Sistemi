import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { HodAcademicianDetailDto } from '../types/hod';
import { hodService } from '../services/hodService';
import { ROUTES } from '../constants/routes';
import Loading from '../components/Loading';
import { getInitials } from '../utils/userDisplay';

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
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [academician, setAcademician] = useState<HodAcademicianDetailDto | null>(null);
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
      const data = await hodService.getAcademicianDetail(userId);
      setAcademician(data);
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
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOD_ACADEMICIANS)}
            className="inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Akademisyenler Listesi
          </button>
        </div>
        <div className="rounded-xl border border-error/30 bg-error-container/10 p-8 text-center">
          <span className="material-symbols-outlined mb-3 text-5xl text-error">person_off</span>
          <p className="font-headline-md text-headline-md text-error">Akademisyen Bulunamadı</p>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            {error ?? 'Bu akademisyen mevcut bölümünüzde bulunmamaktadır.'}
          </p>
          <button
            type="button"
            onClick={() => void loadDetail()}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-outline-variant px-5 py-2.5 font-label-md text-label-md text-primary transition-colors hover:bg-primary/5 hover:border-primary/40"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const initials = getInitials(academician.fullName) || '?';

  return (
    <div className="w-full min-w-0 animate-fade-in">
      {/* Back navigation */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(ROUTES.HOD_ACADEMICIANS)}
          className="inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Akademisyenler Listesi
        </button>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Akademisyen Detayı
        </h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Bölümünüzdeki akademisyenin profil ve randevu bilgileri.
        </p>
      </div>

      {/* Profile Card */}
      <section className="mb-6 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* Avatar */}
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-primary-container bg-surface-container font-headline-md text-xl font-semibold text-primary shadow-sm"
            aria-hidden="true"
          >
            {initials}
          </div>

          {/* Identity */}
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

      {/* KPI Cards */}
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
            accent="bg-amber-50 border border-amber-200"
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
    </div>
  );
}
