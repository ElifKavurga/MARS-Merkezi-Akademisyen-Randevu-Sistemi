export type CreateDelegationPayload = {
  appointmentId: number;
  targetUserId: number;
  targetSlotId: number;
  targetSlotDate: string;
  targetStartTime: string;
  targetEndTime: string;
};

export type DelegationStatus =
  | 'PENDING'
  | 'PENDING_STUDENT_APPROVAL'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'STUDENT_REJECTED'
  | 'EXPIRED';

export type DelegationTarget = {
  userId: number;
  fullName: string;
  institutionalEmail: string;
  role: 'ACADEMICIAN' | 'ASSISTANT';
  departmentName: string | null;
  relatedCourseAssistant: boolean;
  requiresStudentApproval: boolean;
  targetSlotId: number;
  targetSlotDate: string;
  targetStartTime: string;
  targetEndTime: string;
};

export type DelegationResponse = {
  delegationId: number;
  appointmentId: number;
  delegatedByUserId: number;
  delegatedByUserName: string | null;
  delegatedToUserId: number;
  delegatedToUserName: string | null;
  delegatedAt: string;
  updatedAt: string | null;
  delegationStatus: string;
  categoryName: string | null;
  courseCode: string | null;
  courseName: string | null;
  appointmentDate: string | null;
  startTime: string | null;
  endTime: string | null;
  meetingType: string | null;
  delegatedToRole: string | null;
  approvalRequired: boolean;
  studentApprovalExpiresAt: string | null;
  slotLockStatus: string | null;
};
