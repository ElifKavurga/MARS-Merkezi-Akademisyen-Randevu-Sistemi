import { apiClient } from './apiClient';
import type { HodAcademicianListDto, HodAcademicianDetailDto } from '../types/hod';

export const hodService = {
  getDepartmentAcademicians: async (): Promise<HodAcademicianListDto[]> => {
    const response = await apiClient.get<HodAcademicianListDto[]>('/hod/academicians');
    return response.data;
  },
  getAcademicianDetail: async (userId: number): Promise<HodAcademicianDetailDto> => {
    const response = await apiClient.get<HodAcademicianDetailDto>(`/hod/academicians/${userId}`);
    return response.data;
  },
};
