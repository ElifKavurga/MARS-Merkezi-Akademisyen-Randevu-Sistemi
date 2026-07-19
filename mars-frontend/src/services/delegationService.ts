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
