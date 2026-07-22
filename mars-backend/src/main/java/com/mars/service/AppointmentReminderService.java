package com.mars.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.mars.dto.mail.AppointmentReminderMailContext;
import com.mars.dto.mail.MailDetail;
import com.mars.dto.mail.TemplateMailRequest;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentReminderDelivery;
import com.mars.entity.User;
import com.mars.enums.AppointmentReminderType;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.repository.AppointmentReminderDeliveryRepository;
import com.mars.repository.AppointmentRepository;

@Service
public class AppointmentReminderService {
    private static final Logger LOGGER = LoggerFactory.getLogger(AppointmentReminderService.class);
    private static final Duration TWENTY_FOUR_HOURS = Duration.ofHours(24);
    private static final Duration ONE_HOUR = Duration.ofHours(1);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final AppointmentRepository appointmentRepository;
    private final AppointmentReminderDeliveryRepository deliveryRepository;
    private final MailService mailService;
    private final EmailNotificationPreferenceService preferenceService;
    private final Duration reminderWindow;

    public AppointmentReminderService(
            AppointmentRepository appointmentRepository,
            AppointmentReminderDeliveryRepository deliveryRepository,
            MailService mailService,
            EmailNotificationPreferenceService preferenceService,
            @Value("${mars.mail.reminder-window-minutes:2}") long reminderWindowMinutes) {
        this.appointmentRepository = appointmentRepository;
        this.deliveryRepository = deliveryRepository;
        this.mailService = mailService;
        this.preferenceService = preferenceService;
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
            LOGGER.error("Randevu hatırlatma işlemi tamamlanamadı. appointmentId={}",
                    appointment.getAppointmentId(), ex);
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
        deliveryRepository.findByAppointment_AppointmentIdAndRecipient_UserIdAndReminderType(
                        appointment.getAppointmentId(), recipient.getUserId(), type)
                .ifPresent(delivery -> {
                    delivery.setDeliveryStatus(status);
                    deliveryRepository.save(delivery);
                });
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
        String title = oneHour ? "Randevunuz 1 Saat Sonra Başlıyor" : "MARS Randevu Hatırlatması";
        String content = oneHour
                ? "Yaklaşan randevunuz bir saat içinde başlayacaktır. Lütfen randevu saatini kaçırmamak için hazırlığınızı tamamlayınız."
                : "Yaklaşan randevunuzu hatırlatmak isteriz. Lütfen randevu tarih ve saatini kontrol ediniz.";
        List<MailDetail> details = new ArrayList<>();
        add(details, "Hatırlatma Alıcısı", context.recipientName());
        add(details, "Öğrenci", context.studentName());
        add(details, "Akademisyen / Personel", context.staffName());
        add(details, "Randevu Tarihi", context.appointmentDate().format(DATE_FORMAT));
        add(details, "Başlangıç Saati", context.startTime().format(TIME_FORMAT));
        add(details, "Bitiş Saati", context.endTime().format(TIME_FORMAT));
        add(details, "Görüşme Türü", context.meetingType());
        add(details, "Kategori", context.categoryName());
        add(details, "Ders", context.course());
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("details", List.copyOf(details));
        parameters.put("showSubtitle", true);
        parameters.put("subtitle", oneHour ? "Randevunuz çok yakında başlayacak." : "Randevunuza 24 saat kaldı.");
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
        return MeetingType.FACE_TO_FACE.name().equals(value) ? "Yüz Yüze" : null;
    }

    private void add(List<MailDetail> details, String label, String value) {
        if (value != null && !value.isBlank()) {
            details.add(new MailDetail(label, value));
        }
    }
}
