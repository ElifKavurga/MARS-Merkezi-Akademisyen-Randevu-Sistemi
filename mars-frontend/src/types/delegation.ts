export type CreateDelegationPayload = {
  appointmentId: number;
  assistantId: number;
};

export type DelegationResponse = {
  delegationId: number;
  appointmentId: number;
  delegatedByUserId: number;
  delegatedToUserId: number;
  delegatedAt: string;
  delegationStatus: string;
};
