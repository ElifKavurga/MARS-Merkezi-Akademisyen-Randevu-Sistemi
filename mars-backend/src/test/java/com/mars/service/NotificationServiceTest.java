package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
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
import com.mars.entity.Notification;
import com.mars.entity.Role;
import com.mars.entity.User;
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
