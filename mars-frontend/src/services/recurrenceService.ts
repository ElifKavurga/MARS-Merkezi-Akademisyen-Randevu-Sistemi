import { apiClient } from './apiClient';
import type {
  RecurrenceRule,
  RecurrenceRuleCreatePayload,
  RecurrenceRuleUpdatePayload,
} from '../types/recurrence';

export async function createRecurrenceRule(
  slotId: number,
  payload: RecurrenceRuleCreatePayload,
): Promise<RecurrenceRule> {
  const { data } = await apiClient.post<RecurrenceRule>('/recurrence-rules', payload, {
    params: { slotId },
  });
  return data;
}

export async function getRecurrenceRule(recurrenceRuleId: number): Promise<RecurrenceRule> {
  const { data } = await apiClient.get<RecurrenceRule>(`/recurrence-rules/${recurrenceRuleId}`);
  return data;
}

export async function updateRecurrenceRule(
  recurrenceRuleId: number,
  payload: RecurrenceRuleUpdatePayload,
): Promise<RecurrenceRule> {
  const { data } = await apiClient.put<RecurrenceRule>(
    `/recurrence-rules/${recurrenceRuleId}`,
    payload,
  );
  return data;
}

export async function endRecurrenceRule(recurrenceRuleId: number): Promise<RecurrenceRule> {
  const { data } = await apiClient.patch<RecurrenceRule>(
    `/recurrence-rules/${recurrenceRuleId}/end`,
  );
  return data;
}
