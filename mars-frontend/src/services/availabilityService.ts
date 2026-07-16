import { apiClient } from './apiClient';
import type {
  AvailabilitySlot,
  AvailabilitySlotBlockPayload,
  AvailabilitySlotCreatePayload,
  AvailabilitySlotStats,
  AvailabilitySlotUpdatePayload,
} from '../types/availability';

export async function getMyAvailabilitySlots(): Promise<AvailabilitySlot[]> {
  const { data } = await apiClient.get<AvailabilitySlot[]>('/availability-slots/my');
  return data;
}

export async function getMyAvailabilityStats(): Promise<AvailabilitySlotStats> {
  const { data } = await apiClient.get<AvailabilitySlotStats>('/availability-slots/my/stats');
  return data;
}

export async function createAvailabilitySlots(
  payload: AvailabilitySlotCreatePayload,
): Promise<AvailabilitySlot[]> {
  const { data } = await apiClient.post<AvailabilitySlot[]>('/availability-slots', payload);
  return data;
}

export async function updateAvailabilitySlot(
  slotId: number,
  payload: AvailabilitySlotUpdatePayload,
): Promise<AvailabilitySlot> {
  const { data } = await apiClient.put<AvailabilitySlot>(`/availability-slots/${slotId}`, payload);
  return data;
}

export async function updateAvailabilitySlotBlocked(
  slotId: number,
  payload: AvailabilitySlotBlockPayload,
): Promise<AvailabilitySlot> {
  const { data } = await apiClient.patch<AvailabilitySlot>(
    `/availability-slots/${slotId}/blocked`,
    payload,
  );
  return data;
}
