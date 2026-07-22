package com.mars.service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.mars.dto.NotificationResponse;
import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.mail.MailDetail;
import com.mars.dto.mail.TemplateMailRequest;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentRescheduleApproval;
import com.mars.entity.DelegationLog;
import com.mars.enums.MeetingType;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class NotificationMailPublisher {
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");
    private final MailService mailService;
    private final EmailNotificationPreferenceService preferenceService;

    public void publishAfterCommit(
            String recipient,
            Integer recipientUserId,
            NotificationResponse notification,
            Appointment appointment,
            DelegationLog delegation,
            AppointmentRescheduleApproval reschedule,
            NotificationCreateRequest request) {
        if (!preferenceService.isEnabled(recipientUserId, notification.getNotificationType())) {
            return;
        }
        List<MailDetail> details = buildDetails(appointment, delegation, reschedule);
        Map<String, Object> parameters = presentation(notification, delegation, reschedule);
        applyCustomPresentation(parameters, request);
        parameters.put("details", request.getMailDetails() == null ? details : request.getMailDetails());
        Runnable publish = () -> mailService.sendTemplate(TemplateMailRequest.builder()
                .recipient(recipient)
                .subject(notification.getTitle())
                .title(notification.getTitle())
                .content(notification.getMessage())
                .parameters(parameters)
                .templateName(request.getMailTemplateName())
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

    private void applyCustomPresentation(Map<String, Object> parameters, NotificationCreateRequest request) {
        if (request.getMailSubtitle() != null && !request.getMailSubtitle().isBlank()) {
            parameters.put("subtitle", request.getMailSubtitle());
            parameters.put("showSubtitle", true);
        }
        if (request.getMailStatusText() != null && !request.getMailStatusText().isBlank()) {
            parameters.put("statusText", request.getMailStatusText());
            parameters.put("statusColor", request.getMailStatusColor() == null ? "#1d4ed8" : request.getMailStatusColor());
            parameters.put("statusBackground", request.getMailStatusBackground() == null
                    ? "#eff6ff" : request.getMailStatusBackground());
            parameters.put("showStatus", true);
        }
    }

    private List<MailDetail> buildDetails(
            Appointment appointment,
            DelegationLog delegation,
            AppointmentRescheduleApproval reschedule) {
        if (appointment == null) {
            return List.of();
        }
        List<MailDetail> details = new ArrayList<>();
        add(details, "Öğrenci", appointment.getStudent() == null ? null : appointment.getStudent().getFullName());
        add(details, "Akademisyen / Personel", appointment.getStaff() == null ? null : appointment.getStaff().getFullName());

        if (reschedule != null) {
            addSlot(details, "Eski", reschedule.getOriginalSlot());
            addSlot(details, "Yeni", reschedule.getProposedSlot());
            add(details, "Görüşme Türü", meetingType(reschedule.getProposedMeetingType()));
        } else {
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
        }
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
            add(details, "Delegasyon Durumu", delegationStatus(delegation.getDelegationStatus()));
        }
        return List.copyOf(details);
    }

    private Map<String, Object> presentation(
            NotificationResponse notification,
            DelegationLog delegation,
            AppointmentRescheduleApproval reschedule) {
        Map<String, Object> values = new HashMap<>();
        if (reschedule != null) {
            switch (notification.getNotificationType()) {
                case APPOINTMENT_RESCHEDULE_REQUESTED -> putPresentation(values,
                        "Yeni tarih teklifiniz onay bekliyor.", "ONAY BEKLİYOR", "#b45309", "#fffbeb");
                case APPOINTMENT_RESCHEDULED -> putPresentation(values,
                        "Yeni randevu tarihi kesinleşti.", "KABUL EDİLDİ", "#047857", "#ecfdf5");
                case APPOINTMENT_RESCHEDULE_REJECTED, APPOINTMENT_CANCELLED -> putPresentation(values,
                        "Teklif reddedildi ve randevu iptal edildi.", "REDDEDİLDİ", "#b91c1c", "#fef2f2");
                case APPOINTMENT_RESCHEDULE_EXPIRED -> putPresentation(values,
                        "Yanıt süresi dolduğu için teklif kapatıldı.", "SÜRESİ DOLDU", "#6b7280", "#f3f4f6");
                default -> putPresentation(values, "Randevu yeniden planlama bilgilendirmesi.",
                        "GÜNCELLENDİ", "#1d4ed8", "#eff6ff");
            }
        } else if (delegation != null) {
            switch (notification.getNotificationType()) {
                case DELEGATION_REQUEST, STUDENT_APPROVAL_PENDING -> putPresentation(values,
                        "Delegasyon işlemi için onay bekleniyor.", "ONAY BEKLİYOR", "#b45309", "#fffbeb");
                case DELEGATION_ACCEPTED -> putPresentation(values,
                        "Delegasyon işlemi başarıyla kabul edildi.", "KABUL EDİLDİ", "#047857", "#ecfdf5");
                case DELEGATION_REJECTED -> putPresentation(values,
                        "Delegasyon işlemi reddedildi.", "REDDEDİLDİ", "#b91c1c", "#fef2f2");
                case DELEGATION_EXPIRED -> putPresentation(values,
                        "Yanıt süresi dolduğu için delegasyon kapatıldı.", "SÜRESİ DOLDU", "#6b7280", "#f3f4f6");
                default -> { }
            }
        }
        values.put("showSubtitle", values.containsKey("subtitle"));
        values.put("showStatus", values.containsKey("statusText"));
        return values;
    }

    private void putPresentation(
            Map<String, Object> values, String subtitle, String status, String color, String background) {
        values.put("subtitle", subtitle);
        values.put("statusText", status);
        values.put("statusColor", color);
        values.put("statusBackground", background);
    }

    private void addSlot(List<MailDetail> details, String prefix, com.mars.entity.AvailabilitySlot slot) {
        if (slot == null) {
            return;
        }
        add(details, prefix + " Tarih", slot.getSlotDate() == null ? null : slot.getSlotDate().format(DATE_FORMAT));
        String time = slot.getStartTime() == null ? null : slot.getStartTime().format(TIME_FORMAT);
        if (time != null && slot.getEndTime() != null) {
            time += " - " + slot.getEndTime().format(TIME_FORMAT);
        }
        add(details, prefix + " Saat", time);
    }

    private String delegationStatus(String status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case "PENDING", "PENDING_STUDENT_APPROVAL" -> "Onay Bekliyor";
            case "ACCEPTED" -> "Kabul Edildi";
            case "REJECTED", "STUDENT_REJECTED" -> "Reddedildi";
            case "EXPIRED" -> "Süresi Doldu";
            default -> status;
        };
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
