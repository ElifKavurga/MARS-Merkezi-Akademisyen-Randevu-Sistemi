import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import AppointmentCreateModal from '../components/AppointmentCreateModal';
import Loading from '../components/Loading';
import { APPOINTMENT_MESSAGES, getMeetingTypeLabel } from '../constants/appointment';
import { FORM_SELECT_CLASS } from '../constants/ui';
import { useToast } from '../hooks/useToast';
import {
  getAppointmentCategories,
  getAvailableSlots,
} from '../services/appointmentService';
import { getUsersByRole } from '../services/userService';
import type { AvailableSlot } from '../types/appointment';
import type { AppointmentCategory } from '../types/category';
import type { AssistantUserOption } from '../types/course';

export default function StudentAppointmentCreatePage() {
  const toast = useToast();
  const [staffList, setStaffList] = useState<AssistantUserOption[]>([]);
  const [staffId, setStaffId] = useState('');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [categories, setCategories] = useState<AppointmentCategory[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingStaff(true);
      setError(null);
      try {
        const [academicians, hods, assistants, cats] = await Promise.all([
          getUsersByRole('ACADEMICIAN'),
          getUsersByRole('HOD'),
          getUsersByRole('ASSISTANT'),
          getAppointmentCategories(),
        ]);
        const merged = [...academicians, ...hods, ...assistants].sort((a, b) =>
          a.fullName.localeCompare(b.fullName, 'tr'),
        );
        setStaffList(merged);
        setCategories(cats);
      } catch (err) {
        if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          setError(APPOINTMENT_MESSAGES.ACCESS_DENIED);
          toast.error(APPOINTMENT_MESSAGES.ACCESS_DENIED);
        } else {
          setError(APPOINTMENT_MESSAGES.LOAD_ERROR);
          toast.error(APPOINTMENT_MESSAGES.LOAD_ERROR);
        }
      } finally {
        setLoadingStaff(false);
      }
    };
    void load();
  }, [toast]);

  const loadSlots = useCallback(
    async (selectedStaffId: string) => {
      if (!selectedStaffId) {
        setSlots([]);
        return;
      }
      setLoadingSlots(true);
      setError(null);
      try {
        const data = await getAvailableSlots(Number(selectedStaffId));
        setSlots(data);
      } catch {
        setSlots([]);
        setError(APPOINTMENT_MESSAGES.LOAD_ERROR);
        toast.error(APPOINTMENT_MESSAGES.LOAD_ERROR);
      } finally {
        setLoadingSlots(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadSlots(staffId);
  }, [staffId, loadSlots]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto w-full">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          {APPOINTMENT_MESSAGES.TITLE}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {APPOINTMENT_MESSAGES.SUBTITLE}
        </p>
      </div>

      <div className="space-y-1.5 max-w-md">
        <label htmlFor="staff-select" className="block font-label-md text-label-md text-on-surface-variant">
          Akademisyen
        </label>
        <select
          id="staff-select"
          className={FORM_SELECT_CLASS}
          value={staffId}
          disabled={loadingStaff}
          onChange={(event) => setStaffId(event.target.value)}
        >
          <option value="">{APPOINTMENT_MESSAGES.SELECT_STAFF}</option>
          {staffList.map((staff) => (
            <option key={staff.userId} value={staff.userId}>
              {staff.fullName}
              {staff.departmentName ? ` — ${staff.departmentName}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface overflow-hidden">
        {loadingStaff || loadingSlots ? (
          <div className="flex justify-center py-16">
            <Loading label="Uygun ofis saatleri yükleniyor..." />
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-body-md text-body-md text-error" role="alert">
              {error}
            </p>
          </div>
        ) : !staffId ? (
          <div className="px-6 py-16 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {APPOINTMENT_MESSAGES.SELECT_STAFF}
            </p>
          </div>
        ) : slots.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {APPOINTMENT_MESSAGES.EMPTY_SLOTS}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/40">
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 text-left">
                    Tarih
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 text-left">
                    Saat
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 text-left">
                    Görüşme Tipi
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 text-right">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr
                    key={slot.slotId}
                    className="border-b border-outline-variant/40 hover:bg-surface-container/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                      {slot.slotDate}
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                      {slot.startTime.slice(0, 5)} – {slot.endTime.slice(0, 5)}
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-background">
                      {getMeetingTypeLabel(slot.meetingType)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <AdminActionButton
                        variant="primary"
                        icon="event_available"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {APPOINTMENT_MESSAGES.REQUEST_BUTTON}
                      </AdminActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AppointmentCreateModal
        open={selectedSlot !== null}
        slot={selectedSlot}
        categories={categories}
        onClose={() => setSelectedSlot(null)}
        onCreated={(message) => {
          toast.success(message);
          void loadSlots(staffId);
        }}
      />
    </div>
  );
}
