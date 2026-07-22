import type { EmailNotificationPreference } from '../types/emailNotificationPreference';
import { apiClient } from './apiClient';

export async function getMyEmailNotificationPreferences(): Promise<EmailNotificationPreference> {
  const { data } = await apiClient.get<EmailNotificationPreference>('/email-preferences/me');
  return data;
}

export async function updateMyEmailNotificationPreferences(
  preferences: EmailNotificationPreference,
): Promise<EmailNotificationPreference> {
  const { data } = await apiClient.put<EmailNotificationPreference>(
    '/email-preferences/me',
    preferences,
  );
  return data;
}
