import { apiClient } from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  ResetPasswordConfirmRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../types/auth';

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>(
    '/auth/reset-password',
    payload,
  );
  return data;
}

export async function confirmResetPassword(
  payload: ResetPasswordConfirmRequest,
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>(
    '/auth/reset-password/confirm',
    payload,
  );
  return data;
}
