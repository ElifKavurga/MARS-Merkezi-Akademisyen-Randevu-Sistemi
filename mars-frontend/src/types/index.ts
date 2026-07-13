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
