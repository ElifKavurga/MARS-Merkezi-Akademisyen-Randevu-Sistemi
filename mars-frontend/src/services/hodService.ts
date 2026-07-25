import { apiClient } from './apiClient';
import type { HodAcademicianListDto, HodAcademicianDetailDto, HodRecentAppointmentDto, HodPerformanceSummaryDto, HodDepartmentKpiDto, HodDepartmentStatsDto, HodDepartmentAnalysisDto } from '../types/hod';

export const hodService = {
  getDepartmentAcademicians: async (): Promise<HodAcademicianListDto[]> => {
    const response = await apiClient.get<HodAcademicianListDto[]>('/hod/academicians');
    return response.data;
  },
  getAcademicianDetail: async (userId: number): Promise<HodAcademicianDetailDto> => {
    const response = await apiClient.get<HodAcademicianDetailDto>(`/hod/academicians/${userId}`);
    return response.data;
  },
  getAcademicianRecentAppointments: async (userId: number): Promise<HodRecentAppointmentDto[]> => {
    const response = await apiClient.get<HodRecentAppointmentDto[]>(`/hod/academicians/${userId}/recent-appointments`);
    return response.data;
  },
  getAcademicianPerformance: async (userId: number): Promise<HodPerformanceSummaryDto> => {
    const response = await apiClient.get<HodPerformanceSummaryDto>(`/hod/academicians/${userId}/performance`);
    return response.data;
  },
  getDepartmentKpiStats: async (): Promise<HodDepartmentKpiDto> => {
    const response = await apiClient.get<HodDepartmentKpiDto>('/hod/department/stats/kpi');
    return response.data;
  },
  getDepartmentStats: async (): Promise<HodDepartmentStatsDto> => {
    const response = await apiClient.get<HodDepartmentStatsDto>('/hod/department/stats/charts');
    return response.data;
  },
  getAcademicianStats: async (userId: number): Promise<HodDepartmentStatsDto> => {
    const response = await apiClient.get<HodDepartmentStatsDto>(`/hod/academicians/${userId}/stats/charts`);
    return response.data;
  },
  getDepartmentAnalysis: async (): Promise<HodDepartmentAnalysisDto> => {
    const response = await apiClient.get<HodDepartmentAnalysisDto>('/hod/department/stats/analysis');
    return response.data;
  },
};
