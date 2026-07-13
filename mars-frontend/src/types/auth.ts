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
};

export type AuthUser = {
  userId: number;
  fullName: string;
  institutionalEmail: string;
  role: string;
};
