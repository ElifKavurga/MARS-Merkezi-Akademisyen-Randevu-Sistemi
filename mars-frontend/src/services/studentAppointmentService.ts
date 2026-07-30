import { apiClient } from './apiClient';
import type {
  Appointment,
  AppointmentCreatePayload,
  AppointmentRescheduleApproval,
  StudentPenaltyStatus,
} from '../types/appointment';
import type { StudentAppointmentListItem } from '../types/studentAppointment';

export async function getStudentActiveAppointments(): Promise<StudentAppointmentListItem[]> {
  const { data } = await apiClient.get<StudentAppointmentListItem[]>('/students/appointments');
  return Array.isArray(data) ? data : [];
}

export async function getStudentPastAppointments(): Promise<StudentAppointmentListItem[]> {
  const { data } = await apiClient.get<StudentAppointmentListItem[]>(
    '/students/appointments/past',
  );
  return Array.isArray(data) ? data : [];
}

export async function getStudentPenaltyStatus(): Promise<StudentPenaltyStatus> {
  const { data } = await apiClient.get<StudentPenaltyStatus>(
    '/students/appointments/penalty-status',
  );
  return data;
}

export async function getStudentAppointment(
  appointmentId: number,
): Promise<StudentAppointmentListItem> {
  const { data } = await apiClient.get<StudentAppointmentListItem>(
    `/students/appointments/${appointmentId}`,
  );
  return data;
}

export async function cancelStudentAppointment(
  appointmentId: number,
): Promise<StudentAppointmentListItem> {
  const { data } = await apiClient.patch<StudentAppointmentListItem>(
    `/students/appointments/${appointmentId}/cancel`,
  );
  return data;
}

export async function createStudentAppointment(
  payload: AppointmentCreatePayload,
): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>('/students/appointments', payload);
  return data;
}

export async function getPendingRescheduleApproval(
  appointmentId: number,
): Promise<AppointmentRescheduleApproval | null> {
  try {
    const { data } = await apiClient.get<AppointmentRescheduleApproval>(
      `/students/appointments/${appointmentId}/reschedule-request`,
    );
    return data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 404) return null;
    throw error;
  }
}

export async function decideRescheduleApproval(
  requestId: number,
  accept: boolean,
): Promise<AppointmentRescheduleApproval> {
  const action = accept ? 'accept' : 'reject';
  const { data } = await apiClient.patch<AppointmentRescheduleApproval>(
    `/students/appointments/reschedule-requests/${requestId}/${action}`,
  );
  return data;
}
