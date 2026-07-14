import { apiClient } from './apiClient';
import type { UserListItem } from '../types/user';

export async function getAdminUsers(): Promise<UserListItem[]> {
  const { data } = await apiClient.get<UserListItem[]>('/admin/users');
  return data;
}
