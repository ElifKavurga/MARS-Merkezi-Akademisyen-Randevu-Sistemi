import { apiClient } from './apiClient';
import type {
  StudentAcademicianPage,
  StudentAcademicianSearchParams,
} from '../types/studentAcademician';

export async function searchStudentAcademicians(
  params: StudentAcademicianSearchParams = {},
): Promise<StudentAcademicianPage> {
  const { data } = await apiClient.get<StudentAcademicianPage>('/students/academicians', {
    params: {
      search: params.search?.trim() || undefined,
      departmentId: params.departmentId,
      academicTitle: params.academicTitle?.trim() || undefined,
      isAcceptingAppointments: params.isAcceptingAppointments,
      sort: params.sort ?? 'NAME_ASC',
      page: params.page ?? 0,
      size: params.size ?? 12,
    },
  });
  return data;
}

export async function getStudentAcademicianTitles(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/students/academicians/titles');
  return data;
}
