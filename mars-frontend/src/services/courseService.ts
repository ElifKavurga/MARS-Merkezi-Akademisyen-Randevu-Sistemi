import { apiClient } from './apiClient';
import type { Course, CourseCreatePayload, CourseUpdatePayload } from '../types/course';

export async function getMyCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>('/courses/my');
  return data;
}

export async function getMyCourse(courseId: number): Promise<Course> {
  const { data } = await apiClient.get<Course>(`/courses/${courseId}`);
  return data;
}

export async function createCourse(payload: CourseCreatePayload): Promise<Course> {
  const { data } = await apiClient.post<Course>('/courses', payload);
  return data;
}

export async function updateCourse(courseId: number, payload: CourseUpdatePayload): Promise<Course> {
  const { data } = await apiClient.put<Course>(`/courses/${courseId}`, payload);
  return data;
}

export async function changeCourseStatus(courseId: number): Promise<Course> {
  const { data } = await apiClient.patch<Course>(`/courses/${courseId}/status`);
  return data;
}
