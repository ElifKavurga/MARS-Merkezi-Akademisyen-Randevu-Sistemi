export type RecurrenceRule = {
  recurrenceRuleId: number;
  repeatType: string;
  repeatCount: number;
  startDate: string;
  endDate: string;
};

export type RecurrenceRuleCreatePayload = {
  repeatType: string;
  repeatCount: number;
  startDate: string;
  endDate: string;
};

export type RecurrenceRuleUpdatePayload = {
  repeatType: string;
  repeatCount: number;
  startDate: string;
  endDate: string;
};
