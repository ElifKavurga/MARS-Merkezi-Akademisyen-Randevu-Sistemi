package com.mars.service;

import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.mars.dto.NotificationResponse;

@ExtendWith(MockitoExtension.class)
class NotificationWebSocketPublisherTest {

    @Mock private SimpMessagingTemplate messagingTemplate;
    @InjectMocks private NotificationWebSocketPublisher publisher;

    @Test
    void publishAfterCommit_sendsOnlyToRecipientUserDestination() {
        String recipient = "academician@mars.edu.tr";
        NotificationResponse notification = NotificationResponse.builder()
                .notificationId(42)
                .title("Yeni Randevu Talebi")
                .build();

        publisher.publishAfterCommit(recipient, notification);

        verify(messagingTemplate).convertAndSendToUser(
                recipient, "/queue/notifications", notification);
    }
}
