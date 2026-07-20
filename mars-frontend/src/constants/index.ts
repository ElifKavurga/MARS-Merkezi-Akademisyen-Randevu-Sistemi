export const APP_NAME = 'MARS';
export const APP_FULL_NAME = 'Modern Akademisyen Randevu Sistemi';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export { ROUTES, academicianCourseDetailPath, studentAcademicianProfilePath } from './routes';
export { STORAGE_KEYS } from './storage';
export {
  ROLES,
  ROLE_HOME_PATH,
  ROLE_LABELS,
  isRole,
  getHomePathForRole,
  getRoleLabel,
} from './roles';
export type { Role } from './roles';
export { UI_LABELS, FORM_FIELD_CLASS, FORM_SELECT_CLASS } from './ui';
export {
  COURSE_STATUS_FILTER,
  COURSE_SORT_FIELD,
  COURSE_MESSAGES,
} from './course';
export type { CourseSortField } from './course';
