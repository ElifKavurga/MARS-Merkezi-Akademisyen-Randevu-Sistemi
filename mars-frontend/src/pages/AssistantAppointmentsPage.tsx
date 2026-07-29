import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AcademicianAppointmentCard from '../components/AcademicianAppointmentCard';
import AcademicianCalendar from '../components/AcademicianCalendar';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import StudentSegmentedTabs from '../components/StudentSegmentedTabs';
import { STAFF_APPOINTMENT_MESSAGES } from '../constants/appointment';
import { assistantAppointmentDetailPath } from '../constants/routes';
import { getStaffAppointments } from '../services/appointmentService';
import type { StaffAppointment } from '../types/appointment';
import type { CalendarDateRange, CalendarEvent } from '../types/calendar';

type TimeScope = 'ACTIVE' | 'PAST';
type ViewMode = 'LIST' | 'CALENDAR';

const TIME_SCOPE_OPTIONS = [
  { value: 'ACTIVE' as const, label: 'Aktif Randevular' },
  { value: 'PAST' as const, label: 'Geçmiş Randevular' },
];

const VIEW_MODE_OPTIONS = [
  { value: 'LIST' as const, label: 'Liste' },
  { value: 'CALENDAR' as const, label: 'Takvim' },
];

const ACTIVE_STATUSES = new Set(['PENDING', 'APPROVED']);
const APPOINTMENT_STATUSES = new Set([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
  'CANCELLED_BY_STUDENT',
  'CANCELLED_BY_ACADEMICIAN',
]);

function resolveStatusFilter(status: string): string {
  if (status === 'ALL') {
    return '';
  }
  return APPOINTMENT_STATUSES.has(status) ? status : '';
}

function compareAppointmentDateTime(left: StaffAppointment, right: StaffAppointment): number {
  const byDate = left.appointmentDate.localeCompare(right.appointmentDate);
  return byDate !== 0 ? byDate : left.startTime.localeCompare(right.startTime);
}

function mapAppointmentToCalendarEvent(appointment: StaffAppointment): CalendarEvent {
  return {
    eventType: 'APPOINTMENT',
    slotId: appointment.appointmentId,
    appointmentId: appointment.appointmentId,
    slotDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    recurrenceRuleId: null,
    isBlocked: false,
    meetingType: appointment.meetingType,
    studentName: appointment.studentName,
    categoryName: appointment.categoryName,
    courseCode: appointment.courseCode,
    courseName: appointment.courseName,
    appointmentStatus: appointment.appointmentStatus,
  };
}

export default function AssistantAppointmentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryStatus = searchParams.get('status')?.trim().toUpperCase() ?? '';
  const initialStatusFilter = resolveStatusFilter(queryStatus);
  const [timeScope, setTimeScope] = useState<TimeScope>(
    initialStatusFilter && !ACTIVE_STATUSES.has(initialStatusFilter) ? 'PAST' : 'ACTIVE',
  );
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAppointments(await getStaffAppointments('assistant'));
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.status === 403
          ? STAFF_APPOINTMENT_MESSAGES.ACCESS_DENIED
          : STAFF_APPOINTMENT_MESSAGES.LOAD_ERROR,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    const resolvedStatus = resolveStatusFilter(queryStatus);
    if (!resolvedStatus) {
      setStatusFilter('');
      return;
    }
    setStatusFilter(resolvedStatus);
    setTimeScope(ACTIVE_STATUSES.has(resolvedStatus) ? 'ACTIVE' : 'PAST');
  }, [queryStatus]);

  const handleTimeScopeChange = (nextScope: TimeScope) => {
    setTimeScope(nextScope);
    setStatusFilter('');
    setSearchParams({}, { replace: true });
  };

  const filteredAppointments = useMemo(() => {
    const byTimeScope = appointments.filter((appointment) => {
      const active = ACTIVE_STATUSES.has(appointment.appointmentStatus);
      return timeScope === 'ACTIVE' ? active : !active;
    });
    const byStatus = statusFilter
      ? byTimeScope.filter((appointment) => appointment.appointmentStatus === statusFilter)
      : byTimeScope;
    return [...byStatus].sort((left, right) =>
      timeScope === 'ACTIVE'
        ? compareAppointmentDateTime(left, right)
        : compareAppointmentDateTime(right, left),
    );
  }, [appointments, statusFilter, timeScope]);

  const calendarEvents = useMemo(
    () => filteredAppointments.map(mapAppointmentToCalendarEvent),
    [filteredAppointments],
  );

  const initialCalendarDate = filteredAppointments[0]?.appointmentDate
    ?? new Date().toISOString().slice(0, 10);
  const emptyTitle = timeScope === 'ACTIVE'
    ? 'Aktif randevunuz bulunmuyor.'
    : 'Geçmiş randevunuz bulunmuyor.';

  const handleRangeChange = (range: CalendarDateRange) => {
    void range;
  };

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <StudentPageHeader
        title="Randevularım"
        description="Size gelen randevuları liste veya takvim görünümünde takip edin."
      />

      <section className="mb-5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <StudentSegmentedTabs
            value={timeScope}
            options={TIME_SCOPE_OPTIONS}
            ariaLabel="Randevu zaman filtresi"
            onChange={handleTimeScopeChange}
            className="lg:w-auto"
          />
          <StudentSegmentedTabs
            value={viewMode}
            options={VIEW_MODE_OPTIONS}
            ariaLabel="Randevu görünümü"
            onChange={setViewMode}
            className="lg:w-auto"
          />
        </div>
      </section>

      {loading ? (
        <StudentLoadingState label={STAFF_APPOINTMENT_MESSAGES.LOADING} />
      ) : error ? (
        <StudentErrorState message={error} onRetry={() => void loadAppointments()} />
      ) : filteredAppointments.length === 0 ? (
        <StudentEmptyState icon="event_note" title={emptyTitle} description="" />
      ) : viewMode === 'LIST' ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAppointments.map((appointment) => (
            <AcademicianAppointmentCard
              key={appointment.appointmentId}
              appointment={appointment}
              onDetailClick={(appointmentId) => navigate(assistantAppointmentDetailPath(appointmentId))}
            />
          ))}
        </div>
      ) : (
        <AcademicianCalendar
          initialDate={initialCalendarDate}
          events={calendarEvents}
          onRangeChange={handleRangeChange}
          onEventClick={(event) => {
            if (event.appointmentId != null) {
              navigate(assistantAppointmentDetailPath(event.appointmentId));
            }
          }}
        />
      )}
    </div>
  );
}
