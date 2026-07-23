import { apiClient } from './apiClient';
import type {
  CreateDelegationPayload,
  DelegationResponse,
  DelegationTarget,
} from '../types/delegation';

export async function createDelegation(
  payload: CreateDelegationPayload,
): Promise<DelegationResponse> {
  const { data } = await apiClient.post<DelegationResponse>('/delegations', payload);
  return data;
}

export async function getDelegationTargets(appointmentId: number): Promise<DelegationTarget[]> {
  const { data } = await apiClient.get<DelegationTarget[]>('/delegations/targets', {
    params: { appointmentId },
  });
  return Array.isArray(data) ? data : [];
}

export async function getPendingStudentDelegations(): Promise<DelegationResponse[]> {
  const { data } = await apiClient.get<DelegationResponse[]>('/delegations/student/pending');
  return Array.isArray(data) ? data : [];
}

export async function acceptStudentDelegation(delegationId: number): Promise<DelegationResponse> {
  const { data } = await apiClient.post<DelegationResponse>(`/delegations/${delegationId}/student-accept`);
  return data;
}

export async function rejectStudentDelegation(delegationId: number): Promise<DelegationResponse> {
  const { data } = await apiClient.post<DelegationResponse>(`/delegations/${delegationId}/student-reject`);
  return data;
}

export async function getIncomingDelegations(): Promise<DelegationResponse[]> {
  const { data } = await apiClient.get<DelegationResponse[]>('/delegations/incoming');
  return data;
}

export async function getDelegationHistory(): Promise<DelegationResponse[]> {
  const { data } = await apiClient.get<DelegationResponse[]>('/delegations/history');
  return data;
}

export async function getDelegation(delegationId: number): Promise<DelegationResponse> {
  const { data } = await apiClient.get<DelegationResponse>(`/delegations/${delegationId}`);
  return data;
}

export async function acceptDelegation(
  delegationId: number,
): Promise<DelegationResponse> {
  const { data } = await apiClient.post<DelegationResponse>(
    `/delegations/${delegationId}/accept`,
  );
  return data;
}

export async function rejectDelegation(
  delegationId: number,
): Promise<DelegationResponse> {
  const { data } = await apiClient.post<DelegationResponse>(
    `/delegations/${delegationId}/reject`,
  );
  return data;
}
