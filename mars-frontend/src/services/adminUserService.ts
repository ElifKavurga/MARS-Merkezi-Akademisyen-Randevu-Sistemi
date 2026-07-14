import { apiClient } from './apiClient';
import type { CreateUserPayload, UserListItem, UserResponse } from '../types/user';

export async function getAdminUsers(): Promise<UserListItem[]> {
  const { data } = await apiClient.get<UserListItem[]>('/admin/users');
  return data;
}

export async function createAdminUser(payload: CreateUserPayload): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>('/admin/users', payload);
  return data;
}
