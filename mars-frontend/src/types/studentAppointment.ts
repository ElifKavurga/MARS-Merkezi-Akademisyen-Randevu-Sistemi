export type StudentAppointmentCategory = {
  categoryId: number;
  categoryName: string;
  description: string | null;
  durationMinutes: number;
  categoryGroup: string;
  requiresCourseSelection: boolean;
};

export type StudentAppointmentCourseOption = {
  courseId: number;
  courseCode: string;
  courseName: string;
  academicTerm: string;
};

export type StudentAppointmentDraft = {
  categoryId: number;
  categoryName: string;
  durationMinutes: number;
  categoryGroup: string;
  requiresCourseSelection: boolean;
  description: string | null;
  courseId: number | null;
  courseCode: string | null;
  courseName: string | null;
  slotId: number | null;
  slotDate: string | null;
  startTime: string | null;
  endTime: string | null;
  /** Slot şablonunun görüşme türü (BOTH dahil); seçim `meetingType` alanında tutulur. */
  slotMeetingType: string | null;
  meetingType: string | null;
};

export type StudentAvailableSlot = {
  slotId: number;
  staffId: number;
  staffName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  meetingType: string;
};

/** Öğrencinin aktif randevu listesi / detay öğesi. */
export type StudentAppointmentListItem = {
  appointmentId: number;
  staffId: number;
  staffName: string;
  academicTitle: string | null;
  departmentName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  categoryName: string;
  courseId: number | null;
  courseCode: string | null;
  courseName: string | null;
  meetingType: string;
  appointmentStatus: string;
  createdAt?: string | null;
  officeName?: string | null;
  officeLocation?: string | null;
};
