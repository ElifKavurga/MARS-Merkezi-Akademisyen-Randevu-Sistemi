package com.mars.mapper;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.NotificationResponse;
import com.mars.entity.Appointment;
import com.mars.entity.DelegationLog;
import com.mars.entity.Notification;
import com.mars.entity.User;

@Component
public class NotificationMapper {

    public Notification toEntity(
            NotificationCreateRequest request,
            User recipient,
            Appointment appointment,
            DelegationLog delegation,
            LocalDateTime createdAt) {
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setNotificationType(request.getNotificationType());
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setRelatedAppointment(appointment);
        notification.setRelatedDelegation(delegation);
        notification.setIsRead(false);
        notification.setEmailDeliveryStatus("PENDING");
        notification.setRecipientEmail(recipient.getInstitutionalEmail());
        notification.setCreatedAt(createdAt);
        notification.setEventKey(request.getEventKey());
        return notification;
    }

    public NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .userId(notification.getUser().getUserId())
                .notificationType(notification.getNotificationType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .relatedAppointmentId(notification.getRelatedAppointment() == null
                        ? null : notification.getRelatedAppointment().getAppointmentId())
                .relatedDelegationId(notification.getRelatedDelegation() == null
                        ? null : notification.getRelatedDelegation().getDelegationId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
