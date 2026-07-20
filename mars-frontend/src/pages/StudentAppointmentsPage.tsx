import { useCallback, useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import StudentAppointmentCard from '../components/StudentAppointmentCard';
import StudentBreadcrumb from '../components/StudentBreadcrumb';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentErrorState from '../components/StudentErrorState';
import StudentLoadingState from '../components/StudentLoadingState';
import StudentPageHeader from '../components/StudentPageHeader';
import { ROUTES } from '../constants/routes';
import { STUDENT_APPOINTMENT_MESSAGES } from '../constants/studentAppointment';
import { STUDENT_UI } from '../constants/studentUi';
import { useToast } from '../hooks/useToast';
import {
  cancelStudentAppointment,
  getStudentActiveAppointments,
  getStudentPastAppointments,
} from '../services/studentAppointmentService';
import type { StudentAppointmentListItem } from '../types/studentAppointment';
import { resolveStudentApiError } from '../utils/studentApiError';

type AppointmentTab = 'active' | 'past';

function TabButton({
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
      className={`pb-3 font-label-md text-label-md transition-colors ${
        active
          ? 'border-b-2 border-primary text-primary'
          : 'border-b-2 border-transparent text-on-surface-variant hover:text-primary'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function StudentAppointmentsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AppointmentTab>('active');
  const [appointmentsByTab, setAppointmentsByTab] = useState<
    Partial<Record<AppointmentTab, StudentAppointmentListItem[]>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<StudentAppointmentListItem | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadTab = useCallback(
    async (tab: AppointmentTab) => {
      setLoading(true);
      setError(null);
      try {
        const data =
          tab === 'active'
            ? await getStudentActiveAppointments()
            : await getStudentPastAppointments();
        setAppointmentsByTab((current) => ({ ...current, [tab]: data }));
      } catch (err) {
        const fallback =
          tab === 'active'
            ? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_LOAD_ERROR
            : STUDENT_APPOINTMENT_MESSAGES.PAST_LOAD_ERROR;
        const message = resolveStudentApiError(err, fallback);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadTab('active');
  }, [loadTab]);

  const handleTabChange = (tab: AppointmentTab) => {
    if (tab === activeTab) {
      return;
    }
    setActiveTab(tab);
    setError(null);
    if (appointmentsByTab[tab] === undefined) {
      void loadTab(tab);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget || cancelLoading) {
      return;
    }
    setCancelLoading(true);
    setCancelError(null);
    try {
      await cancelStudentAppointment(cancelTarget.appointmentId);
      setAppointmentsByTab((current) => ({
        ...current,
        active: (current.active ?? []).filter(
          (item) => item.appointmentId !== cancelTarget.appointmentId,
        ),
        past: undefined,
      }));
      setCancelTarget(null);
      toast.success(STUDENT_APPOINTMENT_MESSAGES.CANCEL_SUCCESS);
    } catch (err) {
      const message = resolveStudentApiError(err, STUDENT_APPOINTMENT_MESSAGES.CANCEL_ERROR);
      setCancelError(message);
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  const appointments = appointmentsByTab[activeTab] ?? [];
  const emptyTitle =
    activeTab === 'active'
      ? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_EMPTY_TITLE
      : STUDENT_APPOINTMENT_MESSAGES.PAST_EMPTY_TITLE;
  const emptyDescription =
    activeTab === 'active'
      ? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_EMPTY_DESCRIPTION
      : STUDENT_APPOINTMENT_MESSAGES.PAST_EMPTY_DESCRIPTION;
  const loadingLabel =
    activeTab === 'active'
      ? STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_LOADING
      : STUDENT_APPOINTMENT_MESSAGES.PAST_LOADING;
  const tabLoaded = appointmentsByTab[activeTab] !== undefined;

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <StudentBreadcrumb
        items={[
          { label: STUDENT_UI.BREADCRUMB_HOME, to: ROUTES.STUDENT },
          { label: STUDENT_UI.BREADCRUMB_APPOINTMENTS },
        ]}
      />
      <StudentPageHeader
        title={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_SUBTITLE}
      />

      <div
        className="mb-4 flex gap-6 border-b border-outline-variant"
        role="tablist"
        aria-label={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_TITLE}
      >
        <TabButton
          active={activeTab === 'active'}
          label={STUDENT_APPOINTMENT_MESSAGES.TAB_ACTIVE}
          onClick={() => handleTabChange('active')}
        />
        <TabButton
          active={activeTab === 'past'}
          label={STUDENT_APPOINTMENT_MESSAGES.TAB_PAST}
          onClick={() => handleTabChange('past')}
        />
      </div>

      {loading || !tabLoaded ? (
        <StudentLoadingState label={loadingLabel} />
      ) : error ? (
        <StudentErrorState message={error} onRetry={() => void loadTab(activeTab)} />
      ) : appointments.length === 0 ? (
        <StudentEmptyState
          icon={activeTab === 'active' ? 'event_note' : 'history'}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {appointments.map((appointment) => (
            <StudentAppointmentCard
              key={appointment.appointmentId}
              appointment={appointment}
              showCancel={activeTab === 'active'}
              cancelLoading={cancelLoading}
              onCancelRequest={(item) => {
                setCancelError(null);
                setCancelTarget(item);
              }}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={cancelTarget !== null}
        title={STUDENT_APPOINTMENT_MESSAGES.CANCEL_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.CANCEL_DESCRIPTION}
        confirmLabel={STUDENT_APPOINTMENT_MESSAGES.CANCEL_CONFIRM}
        cancelLabel={STUDENT_APPOINTMENT_MESSAGES.CANCEL_DISMISS}
        variant="danger"
        loading={cancelLoading}
        error={cancelError}
        onConfirm={() => void handleConfirmCancel()}
        onClose={() => {
          if (!cancelLoading) {
            setCancelTarget(null);
            setCancelError(null);
          }
        }}
      />
    </div>
  );
}
