import { apiClient } from './apiClient';
import type { AssistantAssignedCourse } from '../types/assistantCourse';

export async function getAssistantCourses(): Promise<AssistantAssignedCourse[]> {
  const { data } = await apiClient.get<AssistantAssignedCourse[]>('/assistant/courses');
  return data;
}
