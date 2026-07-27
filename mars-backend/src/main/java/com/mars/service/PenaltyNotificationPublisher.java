package com.mars.service;

import org.springframework.stereotype.Component;

import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.NotificationResponse;
import com.mars.dto.notification.PenaltyNotificationRequest;
import com.mars.enums.NotificationType;
import com.mars.enums.PenaltyNotificationEvent;
import com.mars.service.mail.PenaltyMailSubjectGenerator;
import com.mars.service.mail.PublisherMailDetails;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PenaltyNotificationPublisher {
    private static final String TEMPLATE = "mail/penalty-notification";
    private final NotificationService notificationService;
    private final PenaltyMailSubjectGenerator subjectGenerator;
    private final PublisherMailDetails mailDetails;

    // TODO Sprint Penalty: gelecekteki PenaltyService ceza uygulama ve ceza kaldırma
    // işlemleri kalıcı hale getirildikten sonra bu metot �ağrılmalıdır.
    public NotificationResponse publish(PenaltyNotificationRequest request) {
        boolean applied = request.event() == PenaltyNotificationEvent.APPLIED;
        String subject = subjectGenerator.subject(request.event());
        return notificationService.createNotification(NotificationCreateRequest.builder()
                .userId(request.recipientUserId())
                .notificationType(applied ? NotificationType.PENALTY_APPLIED : NotificationType.PENALTY_LIFTED)
                .title(subject)
                .message(applied
                        ? "Randevu kullanımınız mevcut ceza kuralları kapsamında geçici olarak kısıtlandı."
                        : "Randevu kullanım kısıtlamanız sona erdi.")
                .eventKey("PENALTY:%s:%s:%s".formatted(
                        request.penaltyReferenceId(), request.recipientUserId(), request.event()))
                .mailTemplateName(TEMPLATE)
                .mailSubtitle(applied
                        ? "Ceza ve kısıtlama bilgilerinizi aşağıda inceleyebilirsiniz."
                        : "Randevu oluşturma erişiminiz yeniden kullanılabilir durumda.")
                .mailStatusText(applied ? "KISITLAMA UYGULANDI" : "KISITLAMA KALDIRILDI")
                .mailStatusColor(applied ? "#b91c1c" : "#047857")
                .mailStatusBackground(applied ? "#fef2f2" : "#ecfdf5")
                .mailDetails(mailDetails.builder()
                        .add("Öğrenci", request.studentName())
                        .add("Ceza Nedeni", request.reason())
                        .add("Başlangıç Tarihi", request.startDate())
                        .add("Bitiş Tarihi", request.endDate())
                        .add("Ceza Süresi", request.durationDays() == null
                                ? null : request.durationDays() + " gün")
                        .build())
                .build());
    }
}
