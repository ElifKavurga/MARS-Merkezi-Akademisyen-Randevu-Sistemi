package com.mars.service;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.NotificationResponse;
import com.mars.dto.notification.NoShowNotificationRequest;
import com.mars.enums.NotificationType;
import com.mars.service.mail.NoShowMailSubjectGenerator;
import com.mars.service.mail.PublisherMailDetails;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class NoShowNotificationPublisher {
    private static final String TEMPLATE = "mail/no-show-notification";
    private final NotificationService notificationService;
    private final NoShowMailSubjectGenerator subjectGenerator;
    private final PublisherMailDetails mailDetails;

    // TODO Sprint No-Show: AppointmentService içindeki gelecekteki No-Show durum
    // geçişi ve ceza değerlendirmesi tamamlandıktan sonra bu metot çağrılmalıdır.
    public List<NotificationResponse> publish(NoShowNotificationRequest request) {
        return List.of(
                publishFor(request, request.studentUserId(), subjectGenerator.studentSubject(),
                        "Randevuya katılım göstermediğiniz için kayıt No-Show olarak işlendi. "
                                + safeNextProcess(request.nextProcessInformation()),
                        "Randevunuz No-Show olarak kaydedildi."),
                publishFor(request, request.staffUserId(), subjectGenerator.staffSubject(),
                        "İlgili randevu No-Show olarak kaydedildi.",
                        "No-Show işlemi tamamlandı."));
    }

    private NotificationResponse publishFor(
            NoShowNotificationRequest request,
            Integer recipientId,
            String subject,
            String message,
            String subtitle) {
        return notificationService.createNotification(NotificationCreateRequest.builder()
                .userId(recipientId)
                .notificationType(NotificationType.NO_SHOW_RECORDED)
                .title(subject)
                .message(message)
                .relatedAppointmentId(request.appointmentId())
                .eventKey("NO_SHOW:%s:%s".formatted(request.appointmentId(), recipientId))
                .mailTemplateName(TEMPLATE)
                .mailSubtitle(subtitle)
                .mailStatusText("NO-SHOW")
                .mailStatusColor("#b91c1c")
                .mailStatusBackground("#fef2f2")
                .mailDetails(mailDetails.builder()
                        .add("Öğrenci", request.studentName())
                        .add("Akademisyen / Personel", request.staffName())
                        .add("Randevu Tarihi", request.appointmentDate())
                        .addTimeRange("Randevu Saati", request.startTime(), request.endTime())
                        .add("Kategori", request.categoryName())
                        .add("Ders", request.course())
                        .add("Sonraki Süreç", request.nextProcessInformation())
                        .build())
                .build());
    }

    private String safeNextProcess(String value) {
        return value == null || value.isBlank()
                ? "Sonraki süreç mevcut ceza kurallarına göre değerlendirilecektir." : value;
    }
}
