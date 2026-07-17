import { apiClient } from './apiClient';
import type {
  Appointment,
  AppointmentCreatePayload,
  AssistantAppointment,
  AvailableSlot,
} from '../types/appointment';
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

export async function getAssistantAppointments(
  status?: string,
): Promise<AssistantAppointment[]> {
  const { data } = await apiClient.get<AssistantAppointment[]>('/assistant/appointments', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function getAssistantAppointment(
  appointmentId: number,
): Promise<AssistantAppointment> {
  const { data } = await apiClient.get<AssistantAppointment>(
    `/assistant/appointments/${appointmentId}`,
  );
  return data;
}

export async function approveAssistantAppointment(
  appointmentId: number,
): Promise<AssistantAppointment> {
  const { data } = await apiClient.patch<AssistantAppointment>(
    `/assistant/appointments/${appointmentId}/approve`,
  );
  return data;
}

export async function rejectAssistantAppointment(
  appointmentId: number,
): Promise<AssistantAppointment> {
  const { data } = await apiClient.patch<AssistantAppointment>(
    `/assistant/appointments/${appointmentId}/reject`,
  );
  return data;
}
