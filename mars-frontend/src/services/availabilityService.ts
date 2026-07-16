import { apiClient } from './apiClient';
import type { AvailabilitySlot } from '../types/availability';

export async function getMyAvailabilitySlots(): Promise<AvailabilitySlot[]> {
  const { data } = await apiClient.get<AvailabilitySlot[]>('/availability-slots/my');
  return data;
}
