package com.mars.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.NotificationResponse;
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

    /** Modules use this entry point instead of constructing Notification entities. */
    @Transactional
    public NotificationResponse createNotification(NotificationCreateRequest request) {
        User recipient = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));
        Appointment appointment = request.getRelatedAppointmentId() == null ? null
                : appointmentRepository.findById(request.getRelatedAppointmentId())
                        .orElseThrow(() -> new ResourceNotFoundException(APPOINTMENT_NOT_FOUND));
        DelegationLog delegation = request.getRelatedDelegationId() == null ? null
                : delegationLogRepository.findById(request.getRelatedDelegationId())
                        .orElseThrow(() -> new ResourceNotFoundException(DELEGATION_NOT_FOUND));

        Notification notification = notificationMapper.toEntity(
                request, recipient, appointment, delegation, LocalDateTime.now(APP_ZONE));
        return notificationMapper.toResponse(notificationRepository.save(notification));
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
        Notification notification = notificationMapper.toEntity(
                request,
                recipient,
                delegation == null ? null : delegation.getAppointment(),
                delegation,
                LocalDateTime.now(APP_ZONE));
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications() {
        User user = getCurrentUser();
        return notificationRepository.findTop20ByUser_UserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
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

    private NotificationType mapLegacyType(String type) {
        return switch (type) {
            case "DELEGATION_STUDENT_APPROVAL" -> NotificationType.STUDENT_APPROVAL_PENDING;
            case "DELEGATION_STUDENT_ACCEPTED" -> NotificationType.DELEGATION_ACCEPTED;
            case "DELEGATION_STUDENT_REJECTED" -> NotificationType.DELEGATION_REJECTED;
            case "DELEGATION_EXPIRED" -> NotificationType.DELEGATION_EXPIRED;
            default -> NotificationType.valueOf(type);
        };
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails details)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return details.getUser();
    }
}
