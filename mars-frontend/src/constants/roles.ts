import { ROUTES } from './routes';

export const ROLES = {
  ADMIN: 'ADMIN',
  HOD: 'HOD',
  ACADEMICIAN: 'ACADEMICIAN',
  ASSISTANT: 'ASSISTANT',
  STUDENT: 'STUDENT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HOME_PATH: Record<Role, string> = {
  [ROLES.ADMIN]: ROUTES.ADMIN,
  [ROLES.HOD]: ROUTES.ACADEMICIAN,
  [ROLES.ACADEMICIAN]: ROUTES.ACADEMICIAN,
  [ROLES.ASSISTANT]: ROUTES.ASSISTANT_DASHBOARD,
  [ROLES.STUDENT]: ROUTES.STUDENT,
};

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN]: 'Yönetici',
  [ROLES.HOD]: 'Bölüm Başkanı',
  [ROLES.ACADEMICIAN]: 'Akademisyen',
  [ROLES.ASSISTANT]: 'Araştırma Görevlisi',
  [ROLES.STUDENT]: 'Öğrenci',
};

export function isRole(value: string | null | undefined): value is Role {
  return value != null && Object.values(ROLES).includes(value as Role);
}

export function getHomePathForRole(role: string | null | undefined): string {
  if (isRole(role)) {
    return ROLE_HOME_PATH[role];
  }
  return ROUTES.LOGIN;
}

export function getRoleLabel(role: string | null | undefined): string {
  if (isRole(role)) {
    return ROLE_LABELS[role];
  }
  return role ?? '';
}
