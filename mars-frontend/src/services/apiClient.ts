import axios, { isAxiosError } from 'axios';
import { API_BASE_URL, ROUTES } from '../constants';
import { STORAGE_KEYS } from '../constants/storage';
import { triggerClearSession } from './authSessionBridge';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

function isPublicAuthPath(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/reset-password');
}

function isPublicCatalogPath(url: string): boolean {
  return url === '/roles' || url === '/departments' || url.endsWith('/roles') || url.endsWith('/departments');
}

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const type = localStorage.getItem(STORAGE_KEYS.TOKEN_TYPE) ?? 'Bearer';
    const url = config.url ?? '';

    if (token) {
      config.headers.Authorization = `${type} ${token}`;
      return config;
    }

    if (!isPublicAuthPath(url) && !isPublicCatalogPath(url)) {
      const path = window.location.pathname;
      if (path !== ROUTES.LOGIN && path !== ROUTES.RESET_PASSWORD) {
        window.location.assign(ROUTES.LOGIN);
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      if (!isPublicAuthPath(url)) {
        triggerClearSession();
        if (window.location.pathname !== ROUTES.LOGIN) {
          window.location.assign(ROUTES.LOGIN);
        }
      }
    }
    return Promise.reject(error);
  },
);
