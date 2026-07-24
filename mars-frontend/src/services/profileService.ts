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

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/users/me');
  return data;
}
