export type StudentAcademician = {
  userId: number;
  fullName: string;
  academicTitle: string | null;
  departmentName: string;
  institutionalEmail: string;
  isAcceptingAppointments: boolean;
  profilePhotoUrl: string | null;
};

export type StudentAcademicianPage = {
  content: StudentAcademician[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type StudentAcademicianSort = 'NAME_ASC' | 'NAME_DESC';

export type StudentAcademicianSearchParams = {
  search?: string;
  departmentId?: number;
  academicTitle?: string;
  isAcceptingAppointments?: boolean;
  sort?: StudentAcademicianSort;
  page?: number;
  size?: number;
};
