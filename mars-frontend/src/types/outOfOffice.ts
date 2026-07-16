export type OutOfOfficePeriod = {
  outOfOfficeId: number;
  startDate: string;
  endDate: string;
  reasonCode: string;
};

export type OutOfOfficePeriodCreatePayload = {
  startDate: string;
  endDate: string;
  reasonCode: string;
};

export type OutOfOfficePeriodUpdatePayload = {
  startDate: string;
  endDate: string;
  reasonCode: string;
};
