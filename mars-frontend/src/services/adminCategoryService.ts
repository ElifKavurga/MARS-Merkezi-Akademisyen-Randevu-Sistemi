import { apiClient } from './apiClient';
import type { AppointmentCategory, AppointmentCategoryPayload } from '../types/category';

export async function getAdminCategories(): Promise<AppointmentCategory[]> {
  const { data } = await apiClient.get<AppointmentCategory[]>('/admin/categories');
  return data;
}

export async function createAdminCategory(
  payload: AppointmentCategoryPayload,
): Promise<AppointmentCategory> {
  const { data } = await apiClient.post<AppointmentCategory>('/admin/categories', payload);
  return data;
}

export async function updateAdminCategory(
  categoryId: number,
  payload: AppointmentCategoryPayload,
): Promise<AppointmentCategory> {
  const { data } = await apiClient.put<AppointmentCategory>(
    `/admin/categories/${categoryId}`,
    payload,
  );
  return data;
}

export async function deleteAdminCategory(categoryId: number): Promise<void> {
  await apiClient.delete(`/admin/categories/${categoryId}`);
}
