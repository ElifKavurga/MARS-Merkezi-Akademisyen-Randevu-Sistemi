export type AvailableSlot = {
  slotId: number;
  staffId: number;
  staffName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  meetingType: string;
};

export type Appointment = {
  appointmentId: number;
  studentId: number;
  staffId: number;
  categoryId: number;
  courseId: number | null;
  slotId: number;
  appointmentStatus: string;
  meetingType: string;
  isLimitedDuration: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentCreatePayload = {
  slotId: number;
  categoryId: number;
  courseId?: number | null;
  meetingType?: string | null;
  isLimitedDuration?: boolean;
};

export type AppointmentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type AssistantAppointment = {
  appointmentId: number;
  studentName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  categoryName: string;
  courseCode: string | null;
  courseName: string | null;
  meetingType: 'FACE_TO_FACE' | 'ONLINE';
  appointmentStatus: AppointmentStatus;
};
