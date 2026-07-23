import { apiClient } from './apiClient';

export interface WaitlistEntry {
  waitlistEntryId: number;
  studentId: number;
  studentName: string;
  staffId: number;
  staffName: string;
  categoryId: number;
  categoryName: string;
  courseId: number | null;
  courseCode: string | null;
  courseName: string | null;
  requestedAt: string;
  waitlistStatus: string;
  slotId: number | null;
  offeredAt: string | null;
  expiresAt: string | null;
}

export async function getMyWaitlistEntries(): Promise<WaitlistEntry[]> {
  const { data } = await apiClient.get<WaitlistEntry[]>('/students/waitlists');
  return data;
}

export async function acceptWaitlistOffer(waitlistEntryId: number): Promise<WaitlistEntry> {
  const { data } = await apiClient.patch<WaitlistEntry>(`/students/waitlists/${waitlistEntryId}/accept`);
  return data;
}

export async function rejectWaitlistOffer(waitlistEntryId: number): Promise<WaitlistEntry> {
  const { data } = await apiClient.patch<WaitlistEntry>(`/students/waitlists/${waitlistEntryId}/reject`);
  return data;
}
