export type UserListItem = {
  userId: number;
  fullName: string;
  institutionalEmail: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
};

export type CreateUserPayload = {
  fullName: string;
  institutionalEmail: string;
  password: string;
  roleId: number;
  departmentId: number;
};

export type UpdateUserPayload = {
  fullName: string;
  institutionalEmail: string;
  roleId: number;
  departmentId: number;
};

export type UserResponse = {
  userId: number;
  fullName: string;
  institutionalEmail: string;
  role: string;
  department: string;
  isActive: boolean;
};
