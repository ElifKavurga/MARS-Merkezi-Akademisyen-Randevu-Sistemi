import { apiClient } from './apiClient';
import type {
  Course,
  CourseAssistant,
  CourseAssistantCreatePayload,
  CourseAssignmentUpdatePayload,
  CourseCreatePayload,
  CourseUpdatePayload,
} from '../types/course';

export async function getMyCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>('/courses/my');
  return data;
}

export async function getMyCourse(courseId: number): Promise<Course> {
  const { data } = await apiClient.get<Course>(`/courses/${courseId}`);
  return data;
}

export async function getCourseAssistants(courseId: number): Promise<CourseAssistant[]> {
  const { data } = await apiClient.get<CourseAssistant[]>(`/courses/${courseId}/assistants`);
  return data;
}

export async function assignCourseAssistant(
  courseId: number,
  payload: CourseAssistantCreatePayload,
): Promise<CourseAssistant> {
  const { data } = await apiClient.post<CourseAssistant>(`/courses/${courseId}/assistants`, payload);
  return data;
}

export async function updateCourseAssignment(
  assignmentId: number,
  payload: CourseAssignmentUpdatePayload,
): Promise<CourseAssistant> {
  const { data } = await apiClient.put<CourseAssistant>(`/course-assignments/${assignmentId}`, payload);
  return data;
}

export async function removeCourseAssignment(assignmentId: number): Promise<void> {
  await apiClient.patch(`/course-assignments/${assignmentId}/remove`);
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
