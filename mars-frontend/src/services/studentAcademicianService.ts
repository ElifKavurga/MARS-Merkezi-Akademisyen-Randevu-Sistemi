import { apiClient } from './apiClient';
import type { AvailableSlot } from '../types/appointment';
import type {
  StudentAcademicianCourse,
  StudentAcademicianDetail,
  StudentAcademicianPage,
  StudentAcademicianSearchParams,
} from '../types/studentAcademician';
import type { StudentAvailableSlot } from '../types/studentAppointment';

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

export async function getStudentAcademicianDetail(
  userId: number,
): Promise<StudentAcademicianDetail> {
  const { data } = await apiClient.get<StudentAcademicianDetail>(
    `/students/academicians/${userId}`,
  );
  return data;
}

export async function getStudentAcademicianAvailability(
  userId: number,
): Promise<AvailableSlot[]> {
  const { data } = await apiClient.get<AvailableSlot[]>(
    `/students/academicians/${userId}/availability`,
  );
  return data;
}

export async function getStudentAcademicianCourses(
  userId: number,
): Promise<StudentAcademicianCourse[]> {
  const { data } = await apiClient.get<StudentAcademicianCourse[]>(
    `/students/academicians/${userId}/courses`,
  );
  return data;
}

export async function getStudentAcademicianAvailableSlots(
  userId: number,
  params: { categoryId: number; courseId?: number | null },
): Promise<StudentAvailableSlot[]> {
  const { data } = await apiClient.get<StudentAvailableSlot[]>(
    `/students/academicians/${userId}/available-slots`,
    {
      params: {
        categoryId: params.categoryId,
        courseId: params.courseId ?? undefined,
        includeBooked: true,
      },
    },
  );
  return data;
}
