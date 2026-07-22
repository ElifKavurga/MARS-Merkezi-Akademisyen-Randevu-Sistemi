package com.mars.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mars.entity.AppointmentReminderDelivery;
import com.mars.enums.AppointmentReminderType;

public interface AppointmentReminderDeliveryRepository
        extends JpaRepository<AppointmentReminderDelivery, Integer> {
    Optional<AppointmentReminderDelivery> findByAppointment_AppointmentIdAndRecipient_UserIdAndReminderType(
            Integer appointmentId, Integer recipientId, AppointmentReminderType reminderType);
}
