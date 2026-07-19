export type CreateDelegationPayload = {
  appointmentId: number;
  assistantId: number;
};

export type DelegationResponse = {
  delegationId: number;
  appointmentId: number;
  delegatedByUserId: number;
  delegatedByUserName: string | null;
  delegatedToUserId: number;
  delegatedAt: string;
  delegationStatus: string;
  categoryName: string | null;
  courseCode: string | null;
  courseName: string | null;
  appointmentDate: string | null;
  startTime: string | null;
  endTime: string | null;
  meetingType: string | null;
};
