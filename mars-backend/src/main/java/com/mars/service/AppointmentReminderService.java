package com.mars.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.mars.dto.mail.AppointmentReminderMailContext;
import com.mars.dto.mail.TemplateMailRequest;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentReminderDelivery;
import com.mars.entity.User;
import com.mars.enums.AppointmentReminderType;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.repository.AppointmentReminderDeliveryRepository;
import com.mars.repository.AppointmentRepository;
import com.mars.service.mail.PublisherMailDetails;

@Service
public class AppointmentReminderService {
    private static final Logger LOGGER = LoggerFactory.getLogger(AppointmentReminderService.class);
    private static final Duration TWENTY_FOUR_HOURS = Duration.ofHours(24);
    private static final Duration ONE_HOUR = Duration.ofHours(1);
    private final AppointmentRepository appointmentRepository;
    private final AppointmentReminderDeliveryRepository deliveryRepository;
    private final MailService mailService;
    private final EmailNotificationPreferenceService preferenceService;
    private final PublisherMailDetails mailDetails;
    private final Duration reminderWindow;

    public AppointmentReminderService(
            AppointmentRepository appointmentRepository,
            AppointmentReminderDeliveryRepository deliveryRepository,
            MailService mailService,
            EmailNotificationPreferenceService preferenceService,
            PublisherMailDetails mailDetails,
            @Value("${mars.mail.reminder-window-minutes:2}") long reminderWindowMinutes) {
        this.appointmentRepository = appointmentRepository;
        this.deliveryRepository = deliveryRepository;
        this.mailService = mailService;
        this.preferenceService = preferenceService;
        this.mailDetails = mailDetails;
        this.reminderWindow = Duration.ofMinutes(reminderWindowMinutes);
    }

    public void sendDueReminders(LocalDateTime now) {
        List<Appointment> candidates = appointmentRepository.findReminderCandidates(
                AppointmentStatus.APPROVED.name(), now.toLocalDate(), now.plus(TWENTY_FOUR_HOURS).toLocalDate());
        for (Appointment appointment : candidates) {
            trySend(appointment, appointment.getStudent(), now);
            trySend(appointment, appointment.getStaff(), now);
        }
    }

    private void trySend(Appointment appointment, User recipient, LocalDateTime now) {
        try {
            sendIfDue(appointment, recipient, now);
        } catch (RuntimeException ex) {
            LOGGER.error("Randevu hatÃ„Â±rlatma iÃ…Å¸lemi tamamlanamadÃ„Â±. appointmentId={}, errorType={}",
                    appointment.getAppointmentId(), ex.getClass().getSimpleName());
        }
    }

    private void sendIfDue(Appointment appointment, User recipient, LocalDateTime now) {
        LocalDateTime startsAt = LocalDateTime.of(
                appointment.getSlot().getSlotDate(), appointment.getSlot().getStartTime());
        Duration remaining = Duration.between(now, startsAt);
        AppointmentReminderType type = resolveReminderType(remaining);
        if (type == null || !preferenceService.isReminderEnabled(recipient.getUserId())
                || !claim(appointment, recipient, type, now)) {
            return;
        }

        AppointmentReminderMailContext context = toContext(appointment, recipient, type);
        boolean sent = mailService.sendTemplate(toMailRequest(context));
        updateDeliveryStatus(appointment, recipient, type, sent ? "SENT" : "FAILED");
    }

    private AppointmentReminderType resolveReminderType(Duration remaining) {
        if (remaining.isNegative() || remaining.isZero()) {
            return null;
        }
        if (isWithinWindow(remaining, ONE_HOUR)) {
            return AppointmentReminderType.ONE_HOUR;
        }
        if (isWithinWindow(remaining, TWENTY_FOUR_HOURS)) {
            return AppointmentReminderType.TWENTY_FOUR_HOURS;
        }
        return null;
    }

    private boolean isWithinWindow(Duration remaining, Duration leadTime) {
        return remaining.compareTo(leadTime) <= 0
                && remaining.compareTo(leadTime.minus(reminderWindow)) > 0;
    }

    private boolean claim(
            Appointment appointment, User recipient, AppointmentReminderType type, LocalDateTime now) {
        AppointmentReminderDelivery delivery = new AppointmentReminderDelivery();
        delivery.setAppointment(appointment);
        delivery.setRecipient(recipient);
        delivery.setReminderType(type);
        delivery.setDeliveryStatus("PROCESSING");
        delivery.setAttemptedAt(now);
        try {
            deliveryRepository.saveAndFlush(delivery);
            return true;
        } catch (DataIntegrityViolationException duplicate) {
            return false;
        }
    }

    private void updateDeliveryStatus(
            Appointment appointment, User recipient, AppointmentReminderType type, String status) {
        deliveryRepository.updateDeliveryStatus(
                appointment.getAppointmentId(), recipient.getUserId(), type, status);
    }

    private AppointmentReminderMailContext toContext(
            Appointment appointment, User recipient, AppointmentReminderType type) {
        String course = appointment.getCourse() == null ? null : "%s - %s".formatted(
                appointment.getCourse().getCourseCode(), appointment.getCourse().getCourseName());
        return new AppointmentReminderMailContext(
                recipient.getInstitutionalEmail(), recipient.getFullName(),
                appointment.getStudent().getFullName(), appointment.getStaff().getFullName(),
                appointment.getSlot().getSlotDate(), appointment.getSlot().getStartTime(),
                appointment.getSlot().getEndTime(), meetingType(appointment.getMeetingType()),
                appointment.getCategory().getCategoryName(), course, type);
    }

    private TemplateMailRequest toMailRequest(AppointmentReminderMailContext context) {
        boolean oneHour = context.reminderType() == AppointmentReminderType.ONE_HOUR;
        String title = oneHour ? "Randevunuz 1 Saat Sonra BaÃ…Å¸lÃ„Â±yor" : "MARS Randevu HatÃ„Â±rlatmasÃ„Â±";
        String content = oneHour
                ? "YaklaÃ…Å¸an randevunuz bir saat iÃƒÂ§inde baÃ…Å¸layacaktÃ„Â±r. LÃƒÂ¼tfen randevu saatini kaÃƒÂ§Ã„Â±rmamak iÃƒÂ§in hazÃ„Â±rlÃ„Â±Ã„Å¸Ã„Â±nÃ„Â±zÃ„Â± tamamlayÃ„Â±nÃ„Â±z."
                : "YaklaÃ…Å¸an randevunuzu hatÃ„Â±rlatmak isteriz. LÃƒÂ¼tfen randevu tarih ve saatini kontrol ediniz.";
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("details", mailDetails.builder()
                .add("HatÃ„Â±rlatma AlÃ„Â±cÃ„Â±sÃ„Â±", context.recipientName())
                .add("Ãƒâ€“Ã„Å¸renci", context.studentName())
                .add("Akademisyen / Personel", context.staffName())
                .add("Randevu Tarihi", context.appointmentDate())
                .addTimeRange("Randevu Saati", context.startTime(), context.endTime())
                .add("GÃƒÂ¶rÃƒÂ¼Ã…Å¸me TÃƒÂ¼rÃƒÂ¼", context.meetingType())
                .add("Kategori", context.categoryName())
                .add("Ders", context.course())
                .build());
        parameters.put("showSubtitle", true);
        parameters.put("subtitle", oneHour ? "Randevunuz ÃƒÂ§ok yakÃ„Â±nda baÃ…Å¸layacak." : "Randevunuza 24 saat kaldÃ„Â±.");
        parameters.put("showStatus", true);
        parameters.put("statusText", oneHour ? "1 SAAT KALDI" : "24 SAAT KALDI");
        parameters.put("statusColor", "#1d4ed8");
        parameters.put("statusBackground", "#eff6ff");
        return TemplateMailRequest.builder()
                .recipient(context.recipientEmail())
                .subject(title)
                .title(title)
                .content(content)
                .parameters(parameters)
                .build();
    }

    private String meetingType(String value) {
        if (MeetingType.ONLINE.name().equals(value)) {
            return "Online";
        }
        return MeetingType.FACE_TO_FACE.name().equals(value) ? "YÃƒÂ¼z YÃƒÂ¼ze" : null;
    }
}
