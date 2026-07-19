import { apiClient } from './apiClient';
import type {
  CreateDelegationPayload,
  DelegationResponse,
} from '../types/delegation';

export async function createDelegation(
  payload: CreateDelegationPayload,
): Promise<DelegationResponse> {
  const { data } = await apiClient.post<DelegationResponse>('/delegations', payload);
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
