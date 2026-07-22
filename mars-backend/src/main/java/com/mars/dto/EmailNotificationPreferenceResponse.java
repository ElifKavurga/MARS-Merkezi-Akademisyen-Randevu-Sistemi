package com.mars.dto;

public record EmailNotificationPreferenceResponse(
        boolean appointmentRequest,
        boolean appointmentApproval,
        boolean appointmentRejection,
        boolean appointmentCancellation,
        boolean reschedule,
        boolean delegation,
        boolean appointmentReminder,
        boolean waitlist,
        boolean noShow,
        boolean penalty) {
}
