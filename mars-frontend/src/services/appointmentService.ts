import { apiClient } from './apiClient';
import type {
  AppointmentReschedulePayload,
  AppointmentRescheduleApproval,
  AvailableSlot,
  StaffAppointment,
  StaffAppointmentScope,
} from '../types/appointment';
import type { StudentAvailableSlot } from '../types/studentAppointment';
import type { AppointmentCategory } from '../types/category';

export async function getAvailableSlots(staffId: number): Promise<AvailableSlot[]> {
  const { data } = await apiClient.get<AvailableSlot[]>('/availability-slots/available', {
    params: { staffId },
  });
  return data;
}

export async function getAppointmentCategories(): Promise<AppointmentCategory[]> {
  const { data } = await apiClient.get<AppointmentCategory[]>('/categories');
  return data;
}

export async function getStaffAppointments(
  scope: StaffAppointmentScope,
  status?: string,
): Promise<StaffAppointment[]> {
  const { data } = await apiClient.get<StaffAppointment[]>(`/${scope}/appointments`, {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function getStaffAppointment(
  scope: StaffAppointmentScope,
  appointmentId: number,
): Promise<StaffAppointment> {
  const { data } = await apiClient.get<StaffAppointment>(
    `/${scope}/appointments/${appointmentId}`,
  );
  return data;
}

export async function approveStaffAppointment(
  scope: StaffAppointmentScope,
  appointmentId: number,
): Promise<StaffAppointment> {
  const { data } = await apiClient.patch<StaffAppointment>(
    `/${scope}/appointments/${appointmentId}/approve`,
  );
  return data;
}

export async function rejectStaffAppointment(
  scope: StaffAppointmentScope,
  appointmentId: number,
): Promise<StaffAppointment> {
  const { data } = await apiClient.patch<StaffAppointment>(
    `/${scope}/appointments/${appointmentId}/reject`,
  );
  return data;
}

export async function completeStaffAppointment(
  scope: StaffAppointmentScope,
  appointmentId: number,
): Promise<StaffAppointment> {
  const { data } = await apiClient.patch<StaffAppointment>(
    `/${scope}/appointments/${appointmentId}/complete`,
  );
  return data;
}

export async function markStaffAppointmentNoShow(
  scope: StaffAppointmentScope,
  appointmentId: number,
): Promise<StaffAppointment> {
  const { data } = await apiClient.patch<StaffAppointment>(
    `/${scope}/appointments/${appointmentId}/no-show`,
  );
  return data;
}

export async function getStaffAppointmentRescheduleSlots(
  appointmentId: number,
  scope: StaffAppointmentScope = 'academician',
): Promise<StudentAvailableSlot[]> {
  const { data } = await apiClient.get<StudentAvailableSlot[]>(
    `/${scope}/appointments/${appointmentId}/reschedule-slots`,
  );
  return Array.isArray(data) ? data : [];
}

export async function rescheduleStaffAppointment(
  appointmentId: number,
  payload: AppointmentReschedulePayload,
  scope: StaffAppointmentScope = 'academician',
): Promise<AppointmentRescheduleApproval> {
  const { data } = await apiClient.patch<AppointmentRescheduleApproval>(
    `/${scope}/appointments/${appointmentId}/reschedule`,
    payload,
  );
  return data;
}
