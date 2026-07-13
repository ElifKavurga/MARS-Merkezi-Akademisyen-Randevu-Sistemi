import axios from 'axios';
import { API_BASE_URL } from '../constants';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

apiClient.interceptors.request.use(
  (config) => {
    // Auth token eklenecek
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 yönlendirme eklenecek
    return Promise.reject(error);
  },
);
