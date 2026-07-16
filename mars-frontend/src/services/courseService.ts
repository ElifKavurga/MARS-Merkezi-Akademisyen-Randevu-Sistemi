import { apiClient } from './apiClient';
import type { Course } from '../types/course';

export async function getMyCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>('/courses/my');
  return data;
}
