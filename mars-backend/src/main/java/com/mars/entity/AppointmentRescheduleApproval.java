package com.mars.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "appointment_reschedule_request")
@Getter
@Setter
@NoArgsConstructor
public class AppointmentRescheduleApproval {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reschedule_request_id")
    private Integer rescheduleRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_slot_id", nullable = false)
    private AvailabilitySlot originalSlot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_slot_id", nullable = false)
    private AvailabilitySlot proposedSlot;

    @Column(name = "proposed_meeting_type", nullable = false)
    private String proposedMeetingType;

    @Column(name = "request_status", nullable = false)
    private String requestStatus;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
