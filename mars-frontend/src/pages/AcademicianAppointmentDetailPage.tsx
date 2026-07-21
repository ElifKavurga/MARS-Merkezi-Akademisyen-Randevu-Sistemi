import { useCallback, useEffect, type ReactNode, useState } from 'react';
import { useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import StudentBackLink from '../components/StudentBackLink';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import { STAFF_APPOINTMENT_MESSAGES, getMeetingTypeLabel } from '../constants/appointment';
import { ROUTES } from '../constants/routes';
import { STUDENT_UI } from '../constants/studentUi';
import { useToast } from '../hooks/useToast';
import { approveStaffAppointment, getStaffAppointment, rejectStaffAppointment } from '../services/appointmentService';
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
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const toast = useToast();

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

  const handleApproveClick = () => {
    if (!appointment || appointment.appointmentStatus !== 'PENDING' || isApproving || isRejecting) {
      return;
    }
    setApprovalError(null);
    setShowApproveConfirm(true);
  };

  const handleRejectClick = () => {
    if (!appointment || appointment.appointmentStatus !== 'PENDING' || isApproving || isRejecting) {
      return;
    }
    setRejectionError(null);
    setShowRejectConfirm(true);
  };

  const handleApproveConfirm = async () => {
    if (!appointment || isApproving) {
      return;
    }

    setIsApproving(true);
    setApprovalError(null);
    try {
      const updatedAppointment = await approveStaffAppointment(
        'academician',
        appointment.appointmentId,
      );
      setAppointment(updatedAppointment);
      setShowApproveConfirm(false);
      toast.success(STAFF_APPOINTMENT_MESSAGES.APPROVE_SUCCESS);
    } catch (err) {
      let message: string = STAFF_APPOINTMENT_MESSAGES.ACTION_ERROR;
      if (isAxiosError(err)) {
        if (err.response?.status === 403) {
          message = STAFF_APPOINTMENT_MESSAGES.ACTION_ACCESS_DENIED;
        } else if (err.response?.status === 404) {
          message = STAFF_APPOINTMENT_MESSAGES.ACTION_NOT_FOUND;
        } else if (err.response?.status === 409) {
          message = STAFF_APPOINTMENT_MESSAGES.ACTION_NOT_PENDING;
        }
      }
      setApprovalError(message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!appointment || isRejecting) {
      return;
    }

    setIsRejecting(true);
    setRejectionError(null);
    try {
      const updatedAppointment = await rejectStaffAppointment(
        'academician',
        appointment.appointmentId,
      );
      setAppointment(updatedAppointment);
      setShowRejectConfirm(false);
      toast.success(STAFF_APPOINTMENT_MESSAGES.REJECT_SUCCESS);
    } catch (err) {
      let message: string = STAFF_APPOINTMENT_MESSAGES.ACTION_ERROR;
      if (isAxiosError(err)) {
        if (err.response?.status === 403) {
          message = STAFF_APPOINTMENT_MESSAGES.ACTION_ACCESS_DENIED;
        } else if (err.response?.status === 404) {
          message = STAFF_APPOINTMENT_MESSAGES.ACTION_NOT_FOUND;
        } else if (err.response?.status === 409) {
          message = STAFF_APPOINTMENT_MESSAGES.ACTION_NOT_PENDING;
        }
      }
      setRejectionError(message);
    } finally {
      setIsRejecting(false);
    }
  };

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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <StudentBackLink to={ROUTES.ACADEMICIAN_APPOINTMENTS} label="Geri Dön" />
        {appointment?.appointmentStatus === 'PENDING' ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={STUDENT_UI.PRIMARY_BUTTON_CLASS}
              disabled={isApproving || isRejecting}
              onClick={handleApproveClick}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                check
              </span>
              {isApproving ? 'Onaylanıyor...' : 'Randevuyu Onayla'}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-outline bg-surface-container-lowest px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors duration-150 hover:bg-surface-container disabled:opacity-50"
              disabled={isApproving || isRejecting}
              onClick={handleRejectClick}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                close
              </span>
              {isRejecting ? 'Reddediliyor...' : 'Randevuyu Reddet'}
            </button>
          </div>
        ) : null}
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

      <ConfirmModal
        open={showApproveConfirm && Boolean(appointment)}
        title={STAFF_APPOINTMENT_MESSAGES.APPROVE_TITLE}
        description={STAFF_APPOINTMENT_MESSAGES.APPROVE_DESCRIPTION}
        confirmLabel="Onayla"
        loading={isApproving}
        error={approvalError}
        variant="primary"
        zIndexClass="z-[60]"
        onConfirm={() => void handleApproveConfirm()}
        onClose={() => {
          if (!isApproving) {
            setShowApproveConfirm(false);
            setApprovalError(null);
          }
        }}
      />

      <ConfirmModal
        open={showRejectConfirm && Boolean(appointment)}
        title={STAFF_APPOINTMENT_MESSAGES.REJECT_TITLE}
        description={STAFF_APPOINTMENT_MESSAGES.REJECT_DESCRIPTION}
        confirmLabel="Reddet"
        loading={isRejecting}
        error={rejectionError}
        variant="danger"
        zIndexClass="z-[60]"
        onConfirm={() => void handleRejectConfirm()}
        onClose={() => {
          if (!isRejecting) {
            setShowRejectConfirm(false);
            setRejectionError(null);
          }
        }}
      />
    </div>
  );
}
