import { apiClient } from './apiClient';
import type { AssistantUserOption } from '../types/course';

export async function getUsersByRole(role: string): Promise<AssistantUserOption[]> {
  const { data } = await apiClient.get<AssistantUserOption[]>('/users', {
    params: { role },
  });
  return data;
}

export async function getActiveAssistants(): Promise<AssistantUserOption[]> {
  return getUsersByRole('ASSISTANT');
}
