import { useCallback, useEffect, type ReactNode, useState } from 'react';
import { useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge';
import StudentBackLink from '../components/StudentBackLink';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import { getMeetingTypeLabel } from '../constants/appointment';
import { ROUTES } from '../constants/routes';
import { getStaffAppointment } from '../services/appointmentService';
import type { StaffAppointment } from '../types/appointment';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function getDuration(startTime: string, endTime: string): string {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return minutes > 0 ? `${minutes} dk` : '-';
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <span
        className="material-symbols-outlined mt-0.5 text-[16px] text-on-surface-variant"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        <div className="mt-0.5 break-words font-body-md text-[13px] leading-5 text-on-surface">
          {value}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 sm:p-4">
      <h2 className="mb-3 font-headline-md text-[16px] font-semibold leading-5 text-on-background">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AcademicianAppointmentDetailPage() {
  const { appointmentId: appointmentIdParam } = useParams<{ appointmentId: string }>();
  const appointmentId = Number(appointmentIdParam);
  const isValidId = Number.isInteger(appointmentId) && appointmentId > 0;
  const [appointment, setAppointment] = useState<StaffAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointment = useCallback(async () => {
    if (!isValidId) {
      setAppointment(null);
      setError('Geçersiz randevu bilgisi.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setAppointment(await getStaffAppointment('academician', appointmentId));
    } catch (err) {
      setAppointment(null);
      setError(
        isAxiosError(err) && err.response?.status === 403
          ? 'Bu randevuyu görüntüleme yetkiniz bulunmuyor.'
          : isAxiosError(err) && err.response?.status === 404
            ? 'Randevu bulunamadı.'
            : 'Randevu detayı yüklenirken bir hata oluştu.',
      );
    } finally {
      setLoading(false);
    }
  }, [appointmentId, isValidId]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  const courseLabel = appointment?.courseName
    ? `${appointment.courseCode ?? ''} ${appointment.courseName}`.trim()
    : null;
  const staffTitle = appointment?.staffAcademicTitle?.trim() || '-';
  const dateLabel = appointment ? formatDate(appointment.appointmentDate) : '';
  const timeLabel = appointment
    ? `${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`
    : '';

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-3">
        <StudentBackLink to={ROUTES.ACADEMICIAN_APPOINTMENTS} label="Geri Dön" />
      </div>

      <StudentPageHeader
        title="Randevu Detayı"
        description="Randevu talebinin tüm bilgilerini inceleyin."
      />

      {loading ? (
        <StudentLoadingState label="Randevu detayı yükleniyor..." />
      ) : error ? (
        <StudentErrorState
          message={error}
          onRetry={isValidId ? () => void loadAppointment() : undefined}
          secondaryAction={{ label: 'Geri Dön', to: ROUTES.ACADEMICIAN_APPOINTMENTS }}
        />
      ) : appointment ? (
        <div className="flex flex-col gap-3 md:gap-4">
          <InfoCard title="Öğrenci">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <MetaRow icon="person" label="Ad Soyad" value={appointment.studentName} />
              <MetaRow
                icon="mail"
                label="Kurumsal E-posta"
                value={appointment.studentEmail ?? '-'}
              />
              <MetaRow
                icon="apartment"
                label="Bölüm"
                value={appointment.studentDepartmentName ?? '-'}
              />
            </div>
          </InfoCard>

          <InfoCard title="Randevu">
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-container/70 px-2.5 py-2"
              aria-label={`Tarih: ${dateLabel}, Saat: ${timeLabel}`}
            >
              <div className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
                  event
                </span>
                {dateLabel}
              </div>
              <div className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
                  schedule
                </span>
                {timeLabel}
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <MetaRow icon="category" label="Kategori" value={appointment.categoryName} />
              {courseLabel ? <MetaRow icon="menu_book" label="Ders" value={courseLabel} /> : null}
              <MetaRow icon="event" label="Tarih" value={dateLabel} />
              <MetaRow icon="schedule" label="Başlangıç Saati" value={formatTime(appointment.startTime)} />
              <MetaRow icon="schedule" label="Bitiş Saati" value={formatTime(appointment.endTime)} />
              <MetaRow
                icon="timer"
                label="Süre"
                value={getDuration(appointment.startTime, appointment.endTime)}
              />
              <MetaRow
                icon="videocam"
                label="Görüşme Türü"
                value={getMeetingTypeLabel(appointment.meetingType)}
              />
              <MetaRow
                icon="flag"
                label="Durum"
                value={<AppointmentStatusBadge status={appointment.appointmentStatus} />}
              />
            </div>
          </InfoCard>

          <InfoCard title="Personel">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <MetaRow icon="person" label="Akademisyen / Asistan" value={appointment.staffName ?? '-'} />
              <MetaRow icon="school" label="Ünvan" value={staffTitle} />
              <MetaRow
                icon="apartment"
                label="Bölüm"
                value={appointment.staffDepartmentName ?? '-'}
              />
            </div>
          </InfoCard>
        </div>
      ) : null}
    </div>
  );
}
