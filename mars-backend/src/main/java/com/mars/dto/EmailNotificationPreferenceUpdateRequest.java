package com.mars.dto;

import jakarta.validation.constraints.NotNull;

public record EmailNotificationPreferenceUpdateRequest(
        @NotNull Boolean appointmentRequest,
        @NotNull Boolean appointmentApproval,
        @NotNull Boolean appointmentRejection,
        @NotNull Boolean appointmentCancellation,
        @NotNull Boolean reschedule,
        @NotNull Boolean delegation,
        @NotNull Boolean appointmentReminder,
        @NotNull Boolean waitlist,
        @NotNull Boolean noShow,
        @NotNull Boolean penalty,
        @NotNull Boolean systemAnnouncements) {
}
