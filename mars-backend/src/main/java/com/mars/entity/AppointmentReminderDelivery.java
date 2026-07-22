package com.mars.entity;

import java.time.LocalDateTime;

import com.mars.enums.AppointmentReminderType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "appointment_reminder_delivery", uniqueConstraints = @UniqueConstraint(
        name = "uk_appointment_reminder_delivery",
        columnNames = {"appointment_id", "recipient_user_id", "reminder_type"}))
@Getter
@Setter
@NoArgsConstructor
public class AppointmentReminderDelivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reminder_delivery_id")
    private Integer reminderDeliveryId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_type", nullable = false, length = 32)
    private AppointmentReminderType reminderType;

    @Column(name = "delivery_status", nullable = false, length = 16)
    private String deliveryStatus;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;
}
