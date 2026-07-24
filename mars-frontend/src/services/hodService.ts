import { apiClient } from './apiClient';
import type { HodAcademicianListDto, HodAcademicianDetailDto, HodRecentAppointmentDto, HodPerformanceSummaryDto, HodDepartmentKpiDto } from '../types/hod';

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
};
