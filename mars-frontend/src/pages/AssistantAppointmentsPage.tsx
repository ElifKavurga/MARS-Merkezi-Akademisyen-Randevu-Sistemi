import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import AssistantAppointmentDetailModal from '../components/AssistantAppointmentDetailModal';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge';
import Loading from '../components/Loading';
import {
  ASSISTANT_APPOINTMENT_MESSAGES,
  getMeetingTypeLabel,
} from '../constants/appointment';
import { useToast } from '../hooks/useToast';
import {
  getAssistantAppointment,
  getAssistantAppointments,
} from '../services/appointmentService';
import type { AssistantAppointment } from '../types/appointment';

type AppointmentView = 'PENDING' | 'ALL';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export default function AssistantAppointmentsPage() {
  const toast = useToast();
  const [activeView, setActiveView] = useState<AppointmentView>('PENDING');
  const [appointmentsByView, setAppointmentsByView] = useState<
    Partial<Record<AppointmentView, AssistantAppointment[]>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AssistantAppointment | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);

  const loadAppointments = useCallback(
    async (view: AppointmentView) => {
      setLoading(true);
      setError(null);
      try {
        const appointments = await getAssistantAppointments(
          view === 'PENDING' ? 'PENDING' : undefined,
        );
        setAppointmentsByView((current) => ({ ...current, [view]: appointments }));
      } catch (err) {
        const message =
          isAxiosError(err) && err.response?.status === 403
            ? ASSISTANT_APPOINTMENT_MESSAGES.ACCESS_DENIED
            : ASSISTANT_APPOINTMENT_MESSAGES.LOAD_ERROR;
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadAppointments('PENDING');
  }, [loadAppointments]);

  const handleViewChange = (view: AppointmentView) => {
    if (view === activeView) {
      return;
    }
    setActiveView(view);
    setError(null);
    if (appointmentsByView[view] === undefined) {
      void loadAppointments(view);
    }
  };

  const handleShowDetail = async (appointmentId: number) => {
    if (detailLoadingId !== null) {
      return;
    }
    setDetailLoadingId(appointmentId);
    try {
      setSelectedAppointment(await getAssistantAppointment(appointmentId));
    } catch {
      toast.error(ASSISTANT_APPOINTMENT_MESSAGES.LOAD_ERROR);
    } finally {
      setDetailLoadingId(null);
    }
  };

  const appointments = appointmentsByView[activeView] ?? [];
  const emptyMessage =
    activeView === 'PENDING'
      ? ASSISTANT_APPOINTMENT_MESSAGES.PENDING_EMPTY
      : ASSISTANT_APPOINTMENT_MESSAGES.ALL_EMPTY;

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          {ASSISTANT_APPOINTMENT_MESSAGES.TITLE}
        </h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          {ASSISTANT_APPOINTMENT_MESSAGES.SUBTITLE}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div
          className="flex gap-1 border-b border-outline-variant p-2"
          role="tablist"
          aria-label="Randevu görünümü"
        >
          <ViewTab
            active={activeView === 'PENDING'}
            label={ASSISTANT_APPOINTMENT_MESSAGES.PENDING_TAB}
            onClick={() => handleViewChange('PENDING')}
          />
          <ViewTab
            active={activeView === 'ALL'}
            label={ASSISTANT_APPOINTMENT_MESSAGES.ALL_TAB}
            onClick={() => handleViewChange('ALL')}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loading label="Randevular yükleniyor..." />
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-body-md text-body-md text-error" role="alert">
              {error}
            </p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span
              className="material-symbols-outlined text-[42px] text-on-surface-variant/50"
              aria-hidden="true"
            >
              event_note
            </span>
            <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/40">
                  {['Öğrenci', 'Tarih', 'Saat', 'Kategori', 'Ders', 'Görüşme Türü', 'Durum', ''].map(
                    (label) => (
                      <th
                        key={label || 'actions'}
                        className="px-5 py-4 text-left font-label-md text-label-md font-semibold text-on-surface-variant"
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr
                    key={appointment.appointmentId}
                    className="border-b border-outline-variant/40 transition-colors hover:bg-surface-container/30"
                  >
                    <td className="px-5 py-4 font-label-md text-label-md font-semibold text-on-background">
                      {appointment.studentName}
                    </td>
                    <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                      {formatDate(appointment.appointmentDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-body-md text-body-md text-on-background">
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </td>
                    <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                      {appointment.categoryName}
                    </td>
                    <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                      {appointment.courseName
                        ? `${appointment.courseCode ?? ''} ${appointment.courseName}`.trim()
                        : '-'}
                    </td>
                    <td className="px-5 py-4 font-body-md text-body-md text-on-background">
                      {getMeetingTypeLabel(appointment.meetingType)}
                    </td>
                    <td className="px-5 py-4">
                      <AppointmentStatusBadge status={appointment.appointmentStatus} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="rounded-lg border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm text-primary transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={detailLoadingId !== null}
                        onClick={() => void handleShowDetail(appointment.appointmentId)}
                      >
                        {detailLoadingId === appointment.appointmentId ? 'Yükleniyor...' : 'Detay'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AssistantAppointmentDetailModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  );
}

function ViewTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`rounded-lg px-4 py-2 font-label-md text-label-md transition-colors ${
        active
          ? 'bg-primary-container text-on-primary'
          : 'text-on-surface-variant hover:bg-surface-container'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
