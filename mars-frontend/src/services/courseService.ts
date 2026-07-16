import { apiClient } from './apiClient';
import type { Course, CourseCreatePayload } from '../types/course';

export async function getMyCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>('/courses/my');
  return data;
}

export async function createCourse(payload: CourseCreatePayload): Promise<Course> {
  const { data } = await apiClient.post<Course>('/courses', payload);
  return data;
}
