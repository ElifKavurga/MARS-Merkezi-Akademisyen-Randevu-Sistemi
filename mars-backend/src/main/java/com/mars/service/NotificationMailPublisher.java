package com.mars.service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.mars.dto.NotificationResponse;
import com.mars.dto.mail.MailDetail;
import com.mars.dto.mail.TemplateMailRequest;
import com.mars.entity.Appointment;
import com.mars.entity.DelegationLog;
import com.mars.enums.MeetingType;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class NotificationMailPublisher {
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");
    private final MailService mailService;

    public void publishAfterCommit(
            String recipient,
            NotificationResponse notification,
            Appointment appointment,
            DelegationLog delegation) {
        List<MailDetail> details = buildDetails(appointment, delegation);
        Runnable publish = () -> mailService.sendTemplate(TemplateMailRequest.builder()
                .recipient(recipient)
                .subject(notification.getTitle())
                .title(notification.getTitle())
                .content(notification.getMessage())
                .parameters(Map.of("details", details))
                .build());
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            publish.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                publish.run();
            }
        });
    }

    private List<MailDetail> buildDetails(Appointment appointment, DelegationLog delegation) {
        if (appointment == null) {
            return List.of();
        }
        List<MailDetail> details = new ArrayList<>();
        add(details, "Öğrenci", appointment.getStudent() == null ? null : appointment.getStudent().getFullName());
        add(details, "Akademisyen / Personel", appointment.getStaff() == null ? null : appointment.getStaff().getFullName());

        var slot = delegation != null && delegation.getTargetSlot() != null
                ? delegation.getTargetSlot() : appointment.getSlot();
        var date = delegation != null && delegation.getTargetSlotDate() != null
                ? delegation.getTargetSlotDate() : slot == null ? null : slot.getSlotDate();
        var start = delegation != null && delegation.getTargetStartTime() != null
                ? delegation.getTargetStartTime() : slot == null ? null : slot.getStartTime();
        var end = delegation != null && delegation.getTargetEndTime() != null
                ? delegation.getTargetEndTime() : slot == null ? null : slot.getEndTime();
        add(details, "Randevu Tarihi", date == null ? null : date.format(DATE_FORMAT));
        add(details, "Başlangıç Saati", start == null ? null : start.format(TIME_FORMAT));
        add(details, "Bitiş Saati", end == null ? null : end.format(TIME_FORMAT));
        add(details, "Görüşme Türü", meetingType(appointment.getMeetingType()));
        add(details, "Kategori", appointment.getCategory() == null ? null : appointment.getCategory().getCategoryName());
        if (appointment.getCourse() != null) {
            add(details, "Ders", "%s - %s".formatted(
                    appointment.getCourse().getCourseCode(), appointment.getCourse().getCourseName()));
        }
        if (delegation != null) {
            add(details, "Delegasyonu Atayan", delegation.getDelegatedByUser() == null
                    ? null : delegation.getDelegatedByUser().getFullName());
            add(details, "Atanan Personel", delegation.getDelegatedToUser() == null
                    ? null : delegation.getDelegatedToUser().getFullName());
        }
        return List.copyOf(details);
    }

    private String meetingType(String value) {
        if (MeetingType.ONLINE.name().equals(value)) {
            return "Online";
        }
        if (MeetingType.FACE_TO_FACE.name().equals(value)) {
            return "Yüz Yüze";
        }
        return null;
    }

    private void add(List<MailDetail> details, String label, String value) {
        if (value != null && !value.isBlank()) {
            details.add(new MailDetail(label, value));
        }
    }
}
