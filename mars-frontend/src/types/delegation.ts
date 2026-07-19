export type CreateDelegationPayload = {
  appointmentId: number;
  assistantId: number;
};

export type DelegationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

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
};
