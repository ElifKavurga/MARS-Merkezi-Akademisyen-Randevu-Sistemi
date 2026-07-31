export type ApiError = {
  message: string;
  status?: number;
};

export type PaginatedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type { UserListItem } from './user';
export type { AppointmentCategory, AppointmentCategoryPayload } from './category';
export type { PenaltyRule, UpdatePenaltyRulePayload } from './penaltyRule';
export type { RoleOption } from './role';
export type { DepartmentOption } from './department';
export type {
  StudentAcademician,
  StudentAcademicianCourse,
  StudentAcademicianDetail,
  StudentAcademicianPage,
  StudentAcademicianSearchParams,
} from './studentAcademician';
export type {
  LoginRequest,
  LoginResponse,
  ResetPasswordConfirmRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  AuthUser,
} from './auth';
export type { HodAcademicianListDto, HodAcademicianDetailDto } from './hod';
