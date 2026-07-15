export type LoginRequest = {
  institutionalEmail: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  type: string;
  userId: number;
  fullName: string;
  institutionalEmail: string;
  role: string;
  department?: string;
  isActive?: boolean;
};

export type ResetPasswordRequest = {
  institutionalEmail: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export type AuthUser = {
  userId: number;
  fullName: string;
  institutionalEmail: string;
  role: string;
  department?: string;
  isActive?: boolean;
};
