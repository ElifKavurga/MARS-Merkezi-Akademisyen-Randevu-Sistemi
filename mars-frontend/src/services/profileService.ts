import { apiClient } from './apiClient';
export interface UserProfile {
  userId: number;
  fullName: string;
  institutionalEmail: string;
  role: string;
  department: string;
  academicTitle: string | null;
  isActive: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/users/me');
  return data;
}

export async function changeMyPassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.patch('/users/me/password', payload);
}
