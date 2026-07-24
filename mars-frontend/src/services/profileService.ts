import { apiClient } from './apiClient';
export interface UserProfile {
  userId: number;
  fullName: string;
  institutionalEmail: string;
  phone: string | null;
  role: string;
  department: string;
  academicTitle: string | null;
  isActive: boolean;
}

export interface UpdateProfileRequest {
  phone: string;
}

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/users/me');
  return data;
}

export async function updateMyProfile(request: UpdateProfileRequest): Promise<UserProfile> {
  const { data } = await apiClient.put<UserProfile>('/users/me', request);
  return data;
}
