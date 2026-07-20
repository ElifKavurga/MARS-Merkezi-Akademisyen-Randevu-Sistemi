import { apiClient } from './apiClient';
import type { StudentAppointmentCategory } from '../types/studentAppointment';

export async function getStudentAppointmentCategories(): Promise<StudentAppointmentCategory[]> {
  const { data } = await apiClient.get<StudentAppointmentCategory[]>(
    '/students/appointment-categories',
  );
  return data;
}
