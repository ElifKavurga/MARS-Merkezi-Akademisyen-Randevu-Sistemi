package com.mars.dto;

import java.util.List;

import com.mars.dto.mail.MailDetail;
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
    /** Internal mail context; it is not persisted or exposed by the REST response. */
    private Integer relatedRescheduleRequestId;
    /** Internal mail presentation fields; they are never exposed by the REST response. */
    private String mailTemplateName;
    private String mailSubtitle;
    private String mailStatusText;
    private String mailStatusColor;
    private String mailStatusBackground;
    private List<MailDetail> mailDetails;
    /** Internal idempotency key; it is never exposed by the REST response. */
    private String eventKey;
}
