import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  STAFF_APPOINTMENT_MESSAGES,
  getMeetingTypeLabel,
} from '../constants/appointment';
import { canDelegateAppointment } from '../constants/delegation';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  approveStaffAppointment,
  getStaffAppointment,
  getStaffAppointments,
  rejectStaffAppointment,
} from '../services/appointmentService';
import type {
  StaffAppointment,
  StaffAppointmentScope,
} from '../types/appointment';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import ConfirmModal from './ConfirmModal';
import DelegationModal from './DelegationModal';
import Loading from './Loading';
import StaffAppointmentDetailModal from './StaffAppointmentDetailModal';
import StudentSegmentedTabs from './StudentSegmentedTabs';
import { STUDENT_UI } from '../constants/studentUi';
import { canDecideStaffAppointment } from '../utils/staffAppointmentPermissions';

type AppointmentView = 'PENDING' | 'ALL';
type AppointmentAction = {
  type: 'approve' | 'reject';
  appointment: StaffAppointment;
};

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

export default function StaffAppointmentsView({
  scope,
}: {
  scope: StaffAppointmentScope;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [activeView, setActiveView] = useState<AppointmentView>('PENDING');
  const [appointmentsByView, setAppointmentsByView] = useState<
    Partial<Record<AppointmentView, StaffAppointment[]>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<StaffAppointment | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<AppointmentAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [delegationTarget, setDelegationTarget] = useState<StaffAppointment | null>(null);

  const loadAppointments = useCallback(
    async (view: AppointmentView) => {
      setLoading(true);
      setError(null);
      try {
        const appointments = await getStaffAppointments(
          scope,
          view === 'PENDING' ? 'PENDING' : undefined,
        );
        setAppointmentsByView((current) => ({ ...current, [view]: appointments }));
      } catch (err) {
        const message =
          isAxiosError(err) && err.response?.status === 403
            ? STAFF_APPOINTMENT_MESSAGES.ACCESS_DENIED
            : STAFF_APPOINTMENT_MESSAGES.LOAD_ERROR;
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, toast],
  );

  useEffect(() => {
    setAppointmentsByView({});
    setActiveView('PENDING');
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
    if (detailLoadingId !== null || actionLoading) {
      return;
    }
    setDetailLoadingId(appointmentId);
    try {
      setSelectedAppointment(await getStaffAppointment(scope, appointmentId));
    } catch {
      toast.error(STAFF_APPOINTMENT_MESSAGES.LOAD_ERROR);
    } finally {
      setDetailLoadingId(null);
    }
  };

  const openActionConfirmation = (
    type: AppointmentAction['type'],
    appointment: StaffAppointment,
  ) => {
    if (actionLoading || !canDecideStaffAppointment(appointment, scope, user)) {
      return;
    }
    setActionError(null);
    setPendingAction({ type, appointment });
  };

  const openDelegation = (appointment: StaffAppointment) => {
    if (actionLoading || !canDelegateAppointment(appointment, scope, user)) {
      return;
    }
    setSelectedAppointment(null);
    setDelegationTarget(appointment);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || actionLoading) {
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      if (pendingAction.type === 'approve') {
        await approveStaffAppointment(
          scope,
          pendingAction.appointment.appointmentId,
        );
        toast.success(STAFF_APPOINTMENT_MESSAGES.APPROVE_SUCCESS);
      } else {
        await rejectStaffAppointment(
          scope,
          pendingAction.appointment.appointmentId,
        );
        toast.success(STAFF_APPOINTMENT_MESSAGES.REJECT_SUCCESS);
      }

      setPendingAction(null);
      setSelectedAppointment(null);
      setAppointmentsByView({});
      await loadAppointments(activeView);
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
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelegationSuccess = async (message: string) => {
    toast.success(message);
    setDelegationTarget(null);
    setAppointmentsByView({});
    await loadAppointments(activeView);
  };

  const appointments = appointmentsByView[activeView] ?? [];
  const emptyMessage =
    activeView === 'PENDING'
      ? STAFF_APPOINTMENT_MESSAGES.PENDING_EMPTY
      : STAFF_APPOINTMENT_MESSAGES.ALL_EMPTY;

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          {STAFF_APPOINTMENT_MESSAGES.TITLE}
        </h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          {STAFF_APPOINTMENT_MESSAGES.SUBTITLE}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div
          className="flex border-b border-outline-variant p-4"
          role="tablist"
          aria-label="Randevu görünümü"
        >
          <StudentSegmentedTabs
            value={activeView}
            options={[
              { value: 'PENDING', label: STAFF_APPOINTMENT_MESSAGES.PENDING_TAB },
              { value: 'ALL', label: STAFF_APPOINTMENT_MESSAGES.ALL_TAB },
            ] as const}
            ariaLabel="Randevu görünümü"
            onChange={(val) => handleViewChange(val as AppointmentView)}
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
                  {[
                    'Öğrenci',
                    'Tarih',
                    'Saat',
                    'Kategori',
                    'Ders',
                    'Görüşme Türü',
                    'Durum',
                    '',
                  ].map((label) => (
                    <th
                      key={label || 'actions'}
                      className="px-5 py-4 text-left font-label-md text-label-md font-semibold text-on-surface-variant"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => {
                  const showDelegate = canDelegateAppointment(appointment, scope, user);
                  const showDecisionActions = canDecideStaffAppointment(appointment, scope, user);
                  return (
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
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {showDecisionActions ? (
                            <>
                              <button
                                type="button"
                                className={`${STUDENT_UI.PRIMARY_BUTTON_CLASS} py-1.5 px-3 text-[13px] gap-1.5`}
                                disabled={actionLoading}
                                onClick={() =>
                                  openActionConfirmation('approve', appointment)
                                }
                              >
                                <span className="material-symbols-outlined text-[16px]">check</span>
                                Onayla
                              </button>
                              <button
                                type="button"
                                className={`${STUDENT_UI.DANGER_BUTTON_CLASS} py-1.5 px-3 text-[13px] gap-1.5`}
                                disabled={actionLoading}
                                onClick={() =>
                                  openActionConfirmation('reject', appointment)
                                }
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                                Reddet
                              </button>
                            </>
                          ) : null}
                          {showDelegate ? (
                            <button
                              type="button"
                              className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} py-1.5 px-3 text-[13px] gap-1.5`}
                              disabled={actionLoading}
                              onClick={() => openDelegation(appointment)}
                            >
                              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                              Devret
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={`${STUDENT_UI.SECONDARY_BUTTON_CLASS} py-1.5 px-3 text-[13px] gap-1.5`}
                            disabled={detailLoadingId !== null || actionLoading}
                            onClick={() =>
                              void handleShowDetail(appointment.appointmentId)
                            }
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            {detailLoadingId === appointment.appointmentId
                              ? 'Yükleniyor...'
                              : 'Detay'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <StaffAppointmentDetailModal
        appointment={selectedAppointment}
        actionDisabled={actionLoading}
        canDecide={
          selectedAppointment
            ? canDecideStaffAppointment(selectedAppointment, scope, user)
            : false
        }
        canDelegate={
          selectedAppointment
            ? canDelegateAppointment(selectedAppointment, scope, user)
            : false
        }
        onApprove={(appointment) =>
          openActionConfirmation('approve', appointment)
        }
        onReject={(appointment) =>
          openActionConfirmation('reject', appointment)
        }
        onDelegate={openDelegation}
        onClose={() => setSelectedAppointment(null)}
      />

      <DelegationModal
        appointment={delegationTarget}
        onClose={() => setDelegationTarget(null)}
        onSuccess={(message) => void handleDelegationSuccess(message)}
      />

      <ConfirmModal
        open={pendingAction !== null}
        title={
          pendingAction?.type === 'approve'
            ? STAFF_APPOINTMENT_MESSAGES.APPROVE_TITLE
            : STAFF_APPOINTMENT_MESSAGES.REJECT_TITLE
        }
        description={
          pendingAction?.type === 'approve'
            ? STAFF_APPOINTMENT_MESSAGES.APPROVE_DESCRIPTION
            : STAFF_APPOINTMENT_MESSAGES.REJECT_DESCRIPTION
        }
        confirmLabel={pendingAction?.type === 'approve' ? 'Onayla' : 'Reddet'}
        variant={pendingAction?.type === 'approve' ? 'primary' : 'danger'}
        loading={actionLoading}
        error={actionError}
        zIndexClass="z-[60]"
        onConfirm={() => void handleConfirmAction()}
        onClose={() => {
          if (!actionLoading) {
            setPendingAction(null);
            setActionError(null);
          }
        }}
      />
    </div>
  );
}
