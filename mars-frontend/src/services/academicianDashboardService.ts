import type { AcademicianDashboardSummary } from '../types/dashboard';
import { apiClient } from './apiClient';

export async function getAcademicianDashboardSummary(): Promise<AcademicianDashboardSummary> {
  const { data } = await apiClient.get<AcademicianDashboardSummary>(
    '/academician/dashboard',
  );
  return data;
}
