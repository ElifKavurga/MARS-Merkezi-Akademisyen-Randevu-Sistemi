import { apiClient } from './apiClient';
import type {
  Appointment,
  AppointmentCreatePayload,
  AppointmentReschedulePayload,
  AvailableSlot,
  StaffAppointment,
  StaffAppointmentScope,
} from '../types/appointment';
import type { StudentAvailableSlot } from '../types/studentAppointment';
import type { AppointmentCategory } from '../types/category';

export async function createAppointment(
  payload: AppointmentCreatePayload,
): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>('/appointments', payload);
  return data;
}

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

export async function getStaffAppointmentRescheduleSlots(
  appointmentId: number,
): Promise<StudentAvailableSlot[]> {
  const { data } = await apiClient.get<StudentAvailableSlot[]>(
    `/academician/appointments/${appointmentId}/reschedule-slots`,
  );
  return Array.isArray(data) ? data : [];
}

export async function rescheduleStaffAppointment(
  appointmentId: number,
  payload: AppointmentReschedulePayload,
): Promise<StaffAppointment> {
  const { data } = await apiClient.patch<StaffAppointment>(
    `/academician/appointments/${appointmentId}/reschedule`,
    payload,
  );
  return data;
}
