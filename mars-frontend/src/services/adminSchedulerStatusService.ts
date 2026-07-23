import { apiClient } from './apiClient';

export interface SchedulerStatus {
  schedulerName: string;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  durationMs: number;
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'RUNNING';
}

export async function getSchedulerStatuses(): Promise<SchedulerStatus[]> {
  const { data } = await apiClient.get<SchedulerStatus[]>('/admin/scheduler-status');
  return data;
}
