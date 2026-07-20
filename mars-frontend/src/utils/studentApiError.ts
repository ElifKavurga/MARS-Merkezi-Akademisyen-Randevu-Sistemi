import { isAxiosError } from 'axios';
import { STUDENT_UI } from '../constants/studentUi';

type ResolveStudentApiErrorOptions = {
  notFoundMessage?: string;
};

export function resolveStudentApiError(
  err: unknown,
  fallback: string = STUDENT_UI.LOAD_ERROR_GENERIC,
  options?: ResolveStudentApiErrorOptions,
): string {
  if (isAxiosError(err)) {
    if (err.response?.status === 403) {
      return STUDENT_UI.ACCESS_DENIED;
    }
    if (err.response?.status === 404) {
      if (options?.notFoundMessage) {
        return options.notFoundMessage;
      }
      const apiMessage = err.response?.data?.message;
      if (typeof apiMessage === 'string' && apiMessage.trim() !== '') {
        return apiMessage;
      }
      return STUDENT_UI.NOT_FOUND_GENERIC;
    }
    const apiMessage = err.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim() !== '') {
      return apiMessage;
    }
  }
  return fallback;
}

export function isStudentApiNotFound(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 404;
}
