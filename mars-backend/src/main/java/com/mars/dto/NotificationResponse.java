package com.mars.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationResponse {
    private Integer notificationId;
    private String notificationType;
    private String title;
    private String message;
    private Integer relatedDelegationId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
