import type { AcademicianDashboardSummary } from '../types/dashboard';
import type { HodDepartmentStatsDto } from '../types/hod';
import { apiClient } from './apiClient';

export async function getAcademicianDashboardSummary(): Promise<AcademicianDashboardSummary> {
  const { data } = await apiClient.get<AcademicianDashboardSummary>(
    '/academician/dashboard',
  );
  return data;
}

export async function getDashboardStats(): Promise<HodDepartmentStatsDto> {
  const { data } = await apiClient.get<HodDepartmentStatsDto>(
    '/academician/dashboard/stats/charts',
  );
  return data;
}
