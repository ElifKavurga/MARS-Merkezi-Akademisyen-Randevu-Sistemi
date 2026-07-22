package com.mars.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_email_notification_preference")
@Getter
@Setter
@NoArgsConstructor
public class UserEmailNotificationPreference {
    @Id
    @Column(name = "user_id")
    private Integer userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "appointment_request", nullable = false) private Boolean appointmentRequest = true;
    @Column(name = "appointment_approval", nullable = false) private Boolean appointmentApproval = true;
    @Column(name = "appointment_rejection", nullable = false) private Boolean appointmentRejection = true;
    @Column(name = "appointment_cancellation", nullable = false) private Boolean appointmentCancellation = true;
    @Column(name = "reschedule", nullable = false) private Boolean reschedule = true;
    @Column(name = "delegation", nullable = false) private Boolean delegation = true;
    @Column(name = "appointment_reminder", nullable = false) private Boolean appointmentReminder = true;
    @Column(name = "waitlist", nullable = false) private Boolean waitlist = true;
    @Column(name = "no_show", nullable = false) private Boolean noShow = true;
    @Column(name = "penalty", nullable = false) private Boolean penalty = true;
}
