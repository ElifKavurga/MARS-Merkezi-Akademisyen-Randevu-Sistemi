import { apiClient } from './apiClient';
import type {
  AssistantAssignedCourse,
  AssistantDashboardSummary,
} from '../types/assistantCourse';

export async function getAssistantCourses(): Promise<AssistantAssignedCourse[]> {
  const { data } = await apiClient.get<AssistantAssignedCourse[]>('/assistant/courses');
  return data;
}

export async function getAssistantDashboard(): Promise<AssistantDashboardSummary> {
  const { data } = await apiClient.get<AssistantDashboardSummary>('/assistant/dashboard');
  return data;
}
