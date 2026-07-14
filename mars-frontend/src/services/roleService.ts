import { apiClient } from './apiClient';
import type { RoleOption } from '../types/role';

export async function getRoles(): Promise<RoleOption[]> {
  const { data } = await apiClient.get<RoleOption[]>('/roles');
  return data;
}
