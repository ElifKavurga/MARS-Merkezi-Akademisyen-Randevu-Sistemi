package com.mars.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.mars.entity.AppointmentReminderDelivery;
import com.mars.enums.AppointmentReminderType;

public interface AppointmentReminderDeliveryRepository
        extends JpaRepository<AppointmentReminderDelivery, Integer> {
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("""
            update AppointmentReminderDelivery delivery
               set delivery.deliveryStatus = :status
             where delivery.appointment.appointmentId = :appointmentId
               and delivery.recipient.userId = :recipientId
               and delivery.reminderType = :reminderType
            """)
    int updateDeliveryStatus(
            @Param("appointmentId") Integer appointmentId,
            @Param("recipientId") Integer recipientId,
            @Param("reminderType") AppointmentReminderType reminderType,
            @Param("status") String status);
}
