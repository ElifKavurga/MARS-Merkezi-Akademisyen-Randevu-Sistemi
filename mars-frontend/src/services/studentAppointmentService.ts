import { apiClient } from './apiClient';
import type { Appointment, AppointmentCreatePayload } from '../types/appointment';
import type { StudentAppointmentListItem } from '../types/studentAppointment';

export async function getStudentActiveAppointments(): Promise<StudentAppointmentListItem[]> {
  const { data } = await apiClient.get<StudentAppointmentListItem[]>('/students/appointments');
  return Array.isArray(data) ? data : [];
}

export async function getStudentAppointment(
  appointmentId: number,
): Promise<StudentAppointmentListItem> {
  const { data } = await apiClient.get<StudentAppointmentListItem>(
    `/students/appointments/${appointmentId}`,
  );
  return data;
}

export async function createStudentAppointment(
  payload: AppointmentCreatePayload,
): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>('/students/appointments', payload);
  return data;
}
