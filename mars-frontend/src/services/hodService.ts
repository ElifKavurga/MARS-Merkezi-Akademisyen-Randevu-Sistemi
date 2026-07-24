import { apiClient } from './apiClient';
import type { HodAcademicianListDto } from '../types/hod';

export const hodService = {
  getDepartmentAcademicians: async (): Promise<HodAcademicianListDto[]> => {
    const response = await apiClient.get<HodAcademicianListDto[]>('/hod/academicians');
    return response.data;
  },
};
