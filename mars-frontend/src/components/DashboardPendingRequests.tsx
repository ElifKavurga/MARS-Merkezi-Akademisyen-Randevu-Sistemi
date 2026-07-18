import { useState } from 'react';
import type { StaffAppointment } from '../types/appointment';
import type { CalendarEvent } from '../types/calendar';
import CalendarEventDetailModal from './CalendarEventDetailModal';
import {
  DashboardPendingAppointmentRow,
} from './DashboardAppointmentRows';
import DashboardEmptyState from './DashboardEmptyState';
import DashboardSectionHeader from './DashboardSectionHeader';
import Loading from './Loading';

type DashboardPendingRequestsProps = {
  appointments: StaffAppointment[];
  loading: boolean;
  errorMessage?: string | null;
  appointmentsPath: string;
  className?: string;
};

function toCalendarEvent(appointment: StaffAppointment): CalendarEvent {
  return {
    eventType: 'APPOINTMENT',
    slotId: 0,
    appointmentId: appointment.appointmentId,
    slotDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    recurrenceRuleId: null,
    isBlocked: null,
    meetingType: appointment.meetingType,
    studentName: appointment.studentName,
    categoryName: appointment.categoryName,
    courseCode: appointment.courseCode,
    courseName: appointment.courseName,
    appointmentStatus: appointment.appointmentStatus,
  };
}

export default function DashboardPendingRequests({
  appointments,
  loading,
  errorMessage = null,
  appointmentsPath,
  className = '',
}: DashboardPendingRequestsProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const preview = appointments.slice(0, 5);

  return (
    <div className={`min-w-0 ${className}`}>
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <DashboardSectionHeader
          title="Bekleyen Talepler"
          actionLabel="Tüm Talepleri Gör"
          actionPath={appointmentsPath}
        />
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loading label="Talepler yükleniyor..." />
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-32 items-center justify-center rounded-lg bg-error-container/40 px-5 py-8 text-center">
              <p className="font-body-md text-body-md text-on-error-container" role="alert">
                {errorMessage}
              </p>
            </div>
          ) : preview.length === 0 ? (
            <DashboardEmptyState
              icon="pending_actions"
              message="Bekleyen randevu talebiniz bulunmuyor."
            />
          ) : (
            <div className="space-y-3">
              {preview.map((appointment) => (
                <DashboardPendingAppointmentRow
                  key={appointment.appointmentId}
                  appointment={appointment}
                  onClick={() => setSelectedEvent(toCalendarEvent(appointment))}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <CalendarEventDetailModal
        open={selectedEvent !== null}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
