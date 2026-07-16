import { apiClient } from './apiClient';
import type {
  OutOfOfficePeriod,
  OutOfOfficePeriodCreatePayload,
  OutOfOfficePeriodUpdatePayload,
} from '../types/outOfOffice';

export async function getMyOutOfOfficePeriods(): Promise<OutOfOfficePeriod[]> {
  const { data } = await apiClient.get<OutOfOfficePeriod[]>('/out-of-office/my');
  return data;
}

export async function createOutOfOfficePeriod(
  payload: OutOfOfficePeriodCreatePayload,
): Promise<OutOfOfficePeriod> {
  const { data } = await apiClient.post<OutOfOfficePeriod>('/out-of-office', payload);
  return data;
}

export async function updateOutOfOfficePeriod(
  outOfOfficeId: number,
  payload: OutOfOfficePeriodUpdatePayload,
): Promise<OutOfOfficePeriod> {
  const { data } = await apiClient.put<OutOfOfficePeriod>(`/out-of-office/${outOfOfficeId}`, payload);
  return data;
}

export async function endOutOfOfficePeriod(outOfOfficeId: number): Promise<OutOfOfficePeriod> {
  const { data } = await apiClient.patch<OutOfOfficePeriod>(`/out-of-office/${outOfOfficeId}/end`);
  return data;
}
