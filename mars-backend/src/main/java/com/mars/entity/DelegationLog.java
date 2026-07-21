package com.mars.entity;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "delegation_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DelegationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delegation_id")
    private Integer delegationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delegated_by_user_id", nullable = false)
    private User delegatedByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delegated_to_user_id", nullable = false)
    private User delegatedToUser;

    @Column(name = "delegated_at", nullable = false)
    private LocalDateTime delegatedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "delegation_status", nullable = false)
    private String delegationStatus;

    @Column(name = "approval_required", nullable = false)
    private Boolean approvalRequired;

    @Column(name = "student_approval_expires_at")
    private LocalDateTime studentApprovalExpiresAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_slot_id")
    private AvailabilitySlot targetSlot;

    @Column(name = "target_slot_date")
    private LocalDate targetSlotDate;

    @Column(name = "target_start_time")
    private LocalTime targetStartTime;

    @Column(name = "target_end_time")
    private LocalTime targetEndTime;

    @Column(name = "slot_lock_status")
    private String slotLockStatus;
}
