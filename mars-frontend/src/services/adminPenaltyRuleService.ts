import { apiClient } from './apiClient';
import type { PenaltyRule, UpdatePenaltyRulePayload } from '../types/penaltyRule';

export async function getAdminPenaltyRule(): Promise<PenaltyRule> {
  const { data } = await apiClient.get<PenaltyRule>('/admin/penalty-rule');
  return data;
}

export async function updateAdminPenaltyRule(
  payload: UpdatePenaltyRulePayload,
): Promise<PenaltyRule> {
  const { data } = await apiClient.put<PenaltyRule>('/admin/penalty-rule', payload);
  return data;
}
