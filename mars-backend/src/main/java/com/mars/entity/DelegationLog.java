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
}
