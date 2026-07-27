package com.mars.dto;

import java.time.LocalDateTime;

import com.mars.enums.NotificationType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationResponse {
    private Integer notificationId;
    private Integer userId;
    private NotificationType notificationType;
    private String title;
    private String message;
    private Integer relatedAppointmentId;
    private Integer relatedDelegationId;
    private String eventKey;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
