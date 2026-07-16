import { apiClient } from './apiClient';
import type { Appointment, AppointmentCreatePayload, AvailableSlot } from '../types/appointment';
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
