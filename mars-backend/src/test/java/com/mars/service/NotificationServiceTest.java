package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.dto.NotificationResponse;
import com.mars.dto.NotificationCreateRequest;
import com.mars.entity.Notification;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.enums.NotificationType;
import com.mars.mapper.NotificationMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.DelegationLogRepository;
import com.mars.repository.NotificationRepository;
import com.mars.repository.UserRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private DelegationLogRepository delegationLogRepository;
    @Mock private NotificationMapper notificationMapper;
    @Mock private NotificationWebSocketPublisher webSocketPublisher;
    @Mock private NotificationMailPublisher mailPublisher;
    @InjectMocks private NotificationService notificationService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void markMyNotificationAsRead_updatesOnlyCurrentUsersNotification() {
        User user = new User();
        user.setUserId(7);
        Role role = new Role();
        role.setRoleName("STUDENT");
        user.setRole(role);
        authenticate(user);

        Notification notification = new Notification();
        notification.setNotificationId(12);
        notification.setUser(user);
        notification.setIsRead(false);
        NotificationResponse response = NotificationResponse.builder()
                .notificationId(12)
                .isRead(true)
                .build();

        when(notificationRepository.findByNotificationIdAndUser_UserId(12, 7))
                .thenReturn(Optional.of(notification));
        when(notificationRepository.save(notification)).thenReturn(notification);
        when(notificationMapper.toResponse(notification)).thenReturn(response);

        NotificationResponse result = notificationService.markMyNotificationAsRead(12);

        assertThat(notification.getIsRead()).isTrue();
        assertThat(result.getIsRead()).isTrue();
        verify(notificationRepository).findByNotificationIdAndUser_UserId(12, 7);
    }

    @Test
    void getMyUnreadCount_countsOnlyCurrentUsersUnreadNotifications() {
        User user = userWithId(7);
        authenticate(user);
        when(notificationRepository.countByUser_UserIdAndIsReadFalse(7)).thenReturn(4L);

        assertThat(notificationService.getMyUnreadCount()).isEqualTo(4L);
        verify(notificationRepository).countByUser_UserIdAndIsReadFalse(7);
    }

    @Test
    void markAllMyNotificationsAsRead_updatesOnlyCurrentUsersUnreadNotifications() {
        User user = userWithId(7);
        authenticate(user);
        when(notificationRepository.markAllAsReadByUserId(7)).thenReturn(3);

        assertThat(notificationService.markAllMyNotificationsAsRead()).isEqualTo(3);
        verify(notificationRepository).markAllAsReadByUserId(7);
    }

    @Test
    void createNotification_sameEventTwice_returnsExistingWithoutDuplicatePublish() {
        User user = userWithId(7);
        user.setInstitutionalEmail("student@mars.edu.tr");
        NotificationCreateRequest request = NotificationCreateRequest.builder()
                .userId(7)
                .notificationType(NotificationType.APPOINTMENT_APPROVED)
                .title("Randevu Onaylandı")
                .message("Randevunuz onaylandı.")
                .relatedAppointmentId(null)
                .build();
        Notification saved = new Notification();
        saved.setNotificationId(12);
        saved.setUser(user);
        NotificationResponse response = NotificationResponse.builder().notificationId(12).build();

        when(userRepository.findByIdForNotificationUpdate(7)).thenReturn(Optional.of(user));
        when(notificationRepository.findByUser_UserIdAndEventKey(org.mockito.ArgumentMatchers.eq(7), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(Optional.empty(), Optional.of(saved));
        when(notificationMapper.toEntity(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(user),
                org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(saved);
        when(notificationRepository.save(saved)).thenReturn(saved);
        when(notificationMapper.toResponse(saved)).thenReturn(response);

        assertThat(notificationService.createNotification(request).getNotificationId()).isEqualTo(12);
        assertThat(notificationService.createNotification(request).getNotificationId()).isEqualTo(12);

        verify(notificationRepository, times(1)).save(saved);
        verify(webSocketPublisher, times(1)).publishAfterCommit("student@mars.edu.tr", response);
        verify(mailPublisher, times(1)).publishAfterCommit(
                "student@mars.edu.tr", 7, response, null, null, null, request);
    }

    private User userWithId(Integer userId) {
        User user = new User();
        user.setUserId(userId);
        Role role = new Role();
        role.setRoleName("STUDENT");
        user.setRole(role);
        return user;
    }

    private void authenticate(User user) {
        CustomUserDetails details = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
    }
}
