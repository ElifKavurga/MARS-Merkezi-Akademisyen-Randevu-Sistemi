import { apiClient } from './apiClient';
import type { CreateUserPayload, UpdateUserPayload, UserListItem, UserResponse } from '../types/user';

export async function getAdminUsers(): Promise<UserListItem[]> {
  const { data } = await apiClient.get<UserListItem[]>('/admin/users');
  return data;
}

export async function createAdminUser(payload: CreateUserPayload): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>('/admin/users', payload);
  return data;
}

export async function updateAdminUser(
  userId: number,
  payload: UpdateUserPayload,
): Promise<UserResponse> {
  const { data } = await apiClient.put<UserResponse>(`/admin/users/${userId}`, payload);
  return data;
}

export async function changeAdminUserStatus(userId: number): Promise<UserResponse> {
  const { data } = await apiClient.patch<UserResponse>(`/admin/users/${userId}/status`);
  return data;
}
