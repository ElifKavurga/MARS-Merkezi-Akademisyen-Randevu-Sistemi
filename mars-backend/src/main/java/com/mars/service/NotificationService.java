package com.mars.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.NotificationResponse;
import com.mars.dto.PageResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.DelegationLog;
import com.mars.entity.Notification;
import com.mars.entity.User;
import com.mars.enums.NotificationType;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.NotificationMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.DelegationLogRepository;
import com.mars.repository.NotificationRepository;
import com.mars.repository.UserRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final String NOTIFICATION_NOT_FOUND = "Bildirim bulunamadı.";
    private static final String USER_NOT_FOUND = "Kullanıcı bulunamadı.";
    private static final String APPOINTMENT_NOT_FOUND = "Randevu bulunamadı.";
    private static final String DELEGATION_NOT_FOUND = "Delegasyon kaydı bulunamadı.";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final DelegationLogRepository delegationLogRepository;
    private final NotificationMapper notificationMapper;
    private final NotificationWebSocketPublisher webSocketPublisher;
    private final NotificationMailPublisher mailPublisher;

    /** Modules use this entry point instead of constructing Notification entities. */
    @Transactional
    public NotificationResponse createNotification(NotificationCreateRequest request) {
        String eventKey = resolveEventKey(request);
        User recipient = userRepository.findByIdForNotificationUpdate(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));
        var existing = notificationRepository.findByUser_UserIdAndEventKey(recipient.getUserId(), eventKey);
        if (existing.isPresent()) {
            return notificationMapper.toResponse(existing.get());
        }
        Appointment appointment = request.getRelatedAppointmentId() == null ? null
                : appointmentRepository.findById(request.getRelatedAppointmentId())
                        .orElseThrow(() -> new ResourceNotFoundException(APPOINTMENT_NOT_FOUND));
        DelegationLog delegation = request.getRelatedDelegationId() == null ? null
                : delegationLogRepository.findById(request.getRelatedDelegationId())
                        .orElseThrow(() -> new ResourceNotFoundException(DELEGATION_NOT_FOUND));
        if (appointment == null && delegation != null) {
            appointment = delegation.getAppointment();
        }

        Notification notification = notificationMapper.toEntity(
                withEventKey(request, eventKey), recipient, appointment, delegation, LocalDateTime.now(APP_ZONE));
        NotificationResponse response = notificationMapper.toResponse(notificationRepository.save(notification));
        webSocketPublisher.publishAfterCommit(recipient.getInstitutionalEmail(), response);
        mailPublisher.publishAfterCommit(recipient.getInstitutionalEmail(), response, appointment, delegation);
        return response;
    }

    /** Compatibility bridge for the existing delegation flow. */
    @Transactional
    public void createPreparedEmailNotification(
            User recipient,
            String type,
            String title,
            String message,
            DelegationLog delegation) {
        NotificationCreateRequest request = NotificationCreateRequest.builder()
                .userId(recipient.getUserId())
                .notificationType(mapLegacyType(type))
                .title(title)
                .message(message)
                .relatedDelegationId(delegation == null ? null : delegation.getDelegationId())
                .build();
        createNotification(request);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications() {
        User user = getCurrentUser();
        return notificationRepository.findTop20ByUser_UserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponseDto<NotificationResponse> getMyNotifications(int page, int size) {
        User user = getCurrentUser();
        Page<Notification> notifications = notificationRepository.findByUser_UserId(
                user.getUserId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponseDto.<NotificationResponse>builder()
                .content(notifications.getContent().stream().map(notificationMapper::toResponse).toList())
                .page(notifications.getNumber())
                .size(notifications.getSize())
                .totalElements(notifications.getTotalElements())
                .totalPages(notifications.getTotalPages())
                .first(notifications.isFirst())
                .last(notifications.isLast())
                .build();
    }

    @Transactional
    public NotificationResponse markMyNotificationAsRead(Integer notificationId) {
        User user = getCurrentUser();
        Notification notification = notificationRepository
                .findByNotificationIdAndUser_UserId(notificationId, user.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(NOTIFICATION_NOT_FOUND));
        notification.setIsRead(true);
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Transactional(readOnly = true)
    public long getMyUnreadCount() {
        return notificationRepository.countByUser_UserIdAndIsReadFalse(getCurrentUser().getUserId());
    }

    @Transactional
    public int markAllMyNotificationsAsRead() {
        return notificationRepository.markAllAsReadByUserId(getCurrentUser().getUserId());
    }

    private NotificationType mapLegacyType(String type) {
        return switch (type) {
            case "DELEGATION_STUDENT_APPROVAL" -> NotificationType.STUDENT_APPROVAL_PENDING;
            case "DELEGATION_STUDENT_ACCEPTED" -> NotificationType.DELEGATION_ACCEPTED;
            case "DELEGATION_STUDENT_REJECTED" -> NotificationType.DELEGATION_REJECTED;
            case "DELEGATION_EXPIRED" -> NotificationType.DELEGATION_EXPIRED;
            default -> NotificationType.valueOf(type);
        };
    }

    private NotificationCreateRequest withEventKey(NotificationCreateRequest request, String eventKey) {
        return NotificationCreateRequest.builder()
                .userId(request.getUserId())
                .title(request.getTitle())
                .message(request.getMessage())
                .notificationType(request.getNotificationType())
                .relatedAppointmentId(request.getRelatedAppointmentId())
                .relatedDelegationId(request.getRelatedDelegationId())
                .eventKey(eventKey)
                .build();
    }

    private String resolveEventKey(NotificationCreateRequest request) {
        if (request.getEventKey() != null && !request.getEventKey().isBlank()) {
            return request.getEventKey();
        }
        String event = String.join("|",
                String.valueOf(request.getUserId()),
                request.getNotificationType().name(),
                String.valueOf(request.getRelatedAppointmentId()),
                String.valueOf(request.getRelatedDelegationId()),
                String.valueOf(request.getTitle()),
                String.valueOf(request.getMessage()));
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(event.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 kullanılamıyor.", ex);
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails details)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return details.getUser();
    }
}
