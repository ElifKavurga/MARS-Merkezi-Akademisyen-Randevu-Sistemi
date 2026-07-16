import { apiClient } from './apiClient';
import type { AvailabilitySlot, AvailabilitySlotCreatePayload } from '../types/availability';

export async function getMyAvailabilitySlots(): Promise<AvailabilitySlot[]> {
  const { data } = await apiClient.get<AvailabilitySlot[]>('/availability-slots/my');
  return data;
}

export async function createAvailabilitySlot(
  payload: AvailabilitySlotCreatePayload,
): Promise<AvailabilitySlot> {
  const { data } = await apiClient.post<AvailabilitySlot>('/availability-slots', payload);
  return data;
}
