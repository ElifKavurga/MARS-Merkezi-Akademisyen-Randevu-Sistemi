export type PenaltyRule = {
  penaltyRuleId: number;
  maxNoShowCount: number;
  banDurationDays: number;
  isActive: boolean;
};

export type UpdatePenaltyRulePayload = {
  maxNoShowCount: number;
  banDurationDays: number;
  isActive: boolean;
};
