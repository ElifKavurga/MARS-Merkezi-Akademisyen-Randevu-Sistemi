export interface EmailNotificationPreference {
  appointmentRequest: boolean;
  appointmentApproval: boolean;
  appointmentRejection: boolean;
  appointmentCancellation: boolean;
  reschedule: boolean;
  delegation: boolean;
  appointmentReminder: boolean;
  waitlist: boolean;
  noShow: boolean;
  penalty: boolean;
  systemAnnouncements: boolean;
}
