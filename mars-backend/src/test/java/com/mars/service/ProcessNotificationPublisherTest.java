package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.NotificationResponse;
import com.mars.dto.notification.NoShowNotificationRequest;
import com.mars.dto.notification.PenaltyNotificationRequest;
import com.mars.dto.notification.WaitlistNotificationRequest;
import com.mars.enums.NotificationType;
import com.mars.enums.PenaltyNotificationEvent;
import com.mars.enums.WaitlistNotificationEvent;
import com.mars.service.mail.NoShowMailSubjectGenerator;
import com.mars.service.mail.PenaltyMailSubjectGenerator;
import com.mars.service.mail.PublisherMailDetails;
import com.mars.service.mail.WaitlistMailSubjectGenerator;

@ExtendWith(MockitoExtension.class)
class ProcessNotificationPublisherTest {
    @Mock private NotificationService notificationService;
    private final PublisherMailDetails details = new PublisherMailDetails();

    @Test
    void waitlistTurnAvailable_preparesCentralNotificationAndMailContext() {
        WaitlistNotificationPublisher publisher = new WaitlistNotificationPublisher(
                notificationService, new WaitlistMailSubjectGenerator(), details);
        when(notificationService.createNotification(any())).thenReturn(NotificationResponse.builder().build());

        publisher.publish(new WaitlistNotificationRequest(
                20, 8, WaitlistNotificationEvent.TURN_AVAILABLE, "Elif Kaya", "Dr. Deniz",
                "Bitirme Projesi", null, LocalDate.of(2026, 7, 24),
                LocalTime.of(14, 30), LocalTime.of(15, 0), "Rezervasyon hakkınızı kullanabilirsiniz."));

        NotificationCreateRequest request = captureSingleRequest();
        assertThat(request.getNotificationType()).isEqualTo(NotificationType.WAITLIST_TURN_AVAILABLE);
        assertThat(request.getMailTemplateName()).isEqualTo("mail/waitlist-notification");
        assertThat(request.getMailStatusText()).isEqualTo("SIRANIZ GELDİ");
        assertThat(request.getMailDetails()).noneMatch(detail -> detail.label().equals("Ders"));
    }

    @Test
    void noShow_preparesStudentAndStaffNotificationsWithoutDirectMailCall() {
        NoShowNotificationPublisher publisher = new NoShowNotificationPublisher(
                notificationService, new NoShowMailSubjectGenerator(), details);
        when(notificationService.createNotification(any())).thenReturn(NotificationResponse.builder().build());

        publisher.publish(new NoShowNotificationRequest(
                20, 10, 100, "Elif Kaya", "Dr. Deniz", LocalDate.of(2026, 7, 24),
                LocalTime.of(14, 30), LocalTime.of(15, 0), "Bitirme Projesi", null,
                "Ceza kurallarına göre değerlendirilecektir."));

        ArgumentCaptor<NotificationCreateRequest> captor = ArgumentCaptor.forClass(NotificationCreateRequest.class);
        verify(notificationService, org.mockito.Mockito.times(2)).createNotification(captor.capture());
        assertThat(captor.getAllValues())
                .allMatch(request -> request.getNotificationType() == NotificationType.NO_SHOW_RECORDED)
                .allMatch(request -> request.getMailTemplateName().equals("mail/no-show-notification"));
        assertThat(captor.getAllValues()).extracting(NotificationCreateRequest::getUserId)
                .containsExactly(20, 10);
    }

    @Test
    void penaltyApplied_preparesReasonAndDateDetails() {
        PenaltyNotificationPublisher publisher = new PenaltyNotificationPublisher(
                notificationService, new PenaltyMailSubjectGenerator(), details);
        when(notificationService.createNotification(any())).thenReturn(NotificationResponse.builder().build());

        publisher.publish(new PenaltyNotificationRequest(
                20, 4, PenaltyNotificationEvent.APPLIED, "Elif Kaya", "No-Show limiti",
                LocalDate.of(2026, 7, 22), LocalDate.of(2026, 7, 29), 7));

        NotificationCreateRequest request = captureSingleRequest();
        assertThat(request.getNotificationType()).isEqualTo(NotificationType.PENALTY_APPLIED);
        assertThat(request.getMailTemplateName()).isEqualTo("mail/penalty-notification");
        assertThat(request.getMailDetails()).anyMatch(detail ->
                detail.label().equals("Ceza Süresi") && detail.value().equals("7 gün"));
    }

    private NotificationCreateRequest captureSingleRequest() {
        ArgumentCaptor<NotificationCreateRequest> captor = ArgumentCaptor.forClass(NotificationCreateRequest.class);
        verify(notificationService).createNotification(captor.capture());
        return captor.getValue();
    }
}
