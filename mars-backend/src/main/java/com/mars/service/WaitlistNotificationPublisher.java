package com.mars.service;

import org.springframework.stereotype.Component;

import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.NotificationResponse;
import com.mars.dto.notification.WaitlistNotificationRequest;
import com.mars.enums.NotificationType;
import com.mars.enums.WaitlistNotificationEvent;
import com.mars.service.mail.PublisherMailDetails;
import com.mars.service.mail.WaitlistMailSubjectGenerator;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class WaitlistNotificationPublisher {
    private static final String TEMPLATE = "mail/waitlist-notification";
    private final NotificationService notificationService;
    private final WaitlistMailSubjectGenerator subjectGenerator;
    private final PublisherMailDetails mailDetails;

    // TODO Sprint Waitlist: WaitlistService durum ge�işleri tamamlandığında ADDED,
    // TURN_AVAILABLE, REMOVED ve CANCELLED işlemlerinden bu metot �ağrılmalıdır.
    public NotificationResponse publish(WaitlistNotificationRequest request) {
        String subject = subjectGenerator.subject(request.event());
        return notificationService.createNotification(NotificationCreateRequest.builder()
                .userId(request.recipientUserId())
                .notificationType(type(request.event()))
                .title(subject)
                .message(message(request.event(), request.reservationInformation()))
                .eventKey("WAITLIST:%s:%s:%s".formatted(
                        request.waitlistEntryId(), request.recipientUserId(), request.event()))
                .mailTemplateName(TEMPLATE)
                .mailSubtitle(subtitle(request.event()))
                .mailStatusText(status(request.event()))
                .mailStatusColor(color(request.event()))
                .mailStatusBackground(background(request.event()))
                .mailDetails(mailDetails.builder()
                        .add("Öğrenci", request.studentName())
                        .add("Akademisyen / Personel", request.staffName())
                        .add("Kategori", request.categoryName())
                        .add("Ders", request.course())
                        .add("Uygun Tarih", request.availableDate())
                        .addTimeRange("Uygun Saat", request.availableStartTime(), request.availableEndTime())
                        .add("Rezervasyon Bilgisi", request.reservationInformation())
                        .build())
                .build());
    }

    private NotificationType type(WaitlistNotificationEvent event) {
        return switch (event) {
            case ADDED -> NotificationType.WAITLIST_ADDED;
            case TURN_AVAILABLE -> NotificationType.WAITLIST_TURN_AVAILABLE;
            case REMOVED -> NotificationType.WAITLIST_REMOVED;
            case CANCELLED -> NotificationType.WAITLIST_CANCELLED;
        };
    }

    private String message(WaitlistNotificationEvent event, String reservationInformation) {
        return switch (event) {
            case ADDED -> "Bekleme listesi kaydınız başarıyla oluşturuldu.";
            case TURN_AVAILABLE -> "Bekleme listesinde sıranız geldi. "
                    + (reservationInformation == null ? "Rezervasyon hakkınızı uygulama üzerinden kullanabilirsiniz."
                            : reservationInformation);
            case REMOVED -> "Bekleme listesinden �ıkarıldınız.";
            case CANCELLED -> "Bekleme listesi kaydınız iptal edildi.";
        };
    }

    private String subtitle(WaitlistNotificationEvent event) {
        return event == WaitlistNotificationEvent.TURN_AVAILABLE
                ? "Yeni rezervasyon hakkınız hazır." : "Bekleme listesi durumunuz güncellendi.";
    }

    private String status(WaitlistNotificationEvent event) {
        return switch (event) {
            case ADDED -> "LİSTEYE EKLENDİ";
            case TURN_AVAILABLE -> "SIRANIZ GELDİ";
            case REMOVED -> "LİSTEDEN �IKARILDI";
            case CANCELLED -> "İPTAL EDİLDİ";
        };
    }

    private String color(WaitlistNotificationEvent event) {
        return event == WaitlistNotificationEvent.TURN_AVAILABLE ? "#047857" : "#1d4ed8";
    }

    private String background(WaitlistNotificationEvent event) {
        return event == WaitlistNotificationEvent.TURN_AVAILABLE ? "#ecfdf5" : "#eff6ff";
    }
}
