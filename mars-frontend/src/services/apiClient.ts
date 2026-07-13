import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { STORAGE_KEYS } from '../constants/storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const type = localStorage.getItem(STORAGE_KEYS.TOKEN_TYPE) ?? 'Bearer';
    if (token) {
      config.headers.Authorization = `${type} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
