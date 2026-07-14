import { apiClient } from './apiClient';
import type { DepartmentOption } from '../types/department';

export async function getDepartments(): Promise<DepartmentOption[]> {
  const { data } = await apiClient.get<DepartmentOption[]>('/departments');
  return data;
}
