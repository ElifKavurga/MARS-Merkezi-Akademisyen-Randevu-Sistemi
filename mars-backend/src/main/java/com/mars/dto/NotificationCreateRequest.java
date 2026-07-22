package com.mars.dto;

import com.mars.enums.NotificationType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationCreateRequest {
    private Integer userId;
    private String title;
    private String message;
    private NotificationType notificationType;
    private Integer relatedAppointmentId;
    private Integer relatedDelegationId;
}
