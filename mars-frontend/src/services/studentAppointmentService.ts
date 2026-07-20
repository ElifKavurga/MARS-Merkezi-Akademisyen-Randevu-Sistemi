import { apiClient } from './apiClient';
import type { Appointment, AppointmentCreatePayload } from '../types/appointment';

export async function createStudentAppointment(
  payload: AppointmentCreatePayload,
): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>('/students/appointments', payload);
  return data;
}
