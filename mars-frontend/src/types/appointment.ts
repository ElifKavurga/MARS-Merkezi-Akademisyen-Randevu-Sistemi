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
  appointmentDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type AppointmentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export type StaffAppointment = {
  appointmentId: number;
  staffId: number;
  studentName: string;
  studentEmail: string | null;
  studentDepartmentName: string | null;
  staffName: string | null;
  staffAcademicTitle: string | null;
  staffDepartmentName: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  categoryName: string;
  courseId: number | null;
  courseCode: string | null;
  courseName: string | null;
  meetingType: 'FACE_TO_FACE' | 'ONLINE';
  appointmentStatus: AppointmentStatus;
};

export type StaffAppointmentScope = 'assistant' | 'academician';

export type AppointmentReschedulePayload = {
  slotId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  meetingType: string;
};

export type AppointmentRescheduleApproval = {
  rescheduleRequestId: number;
  appointmentId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  proposedDate: string;
  proposedStartTime: string;
  proposedEndTime: string;
  proposedMeetingType: string;
  expiresAt: string;
};
