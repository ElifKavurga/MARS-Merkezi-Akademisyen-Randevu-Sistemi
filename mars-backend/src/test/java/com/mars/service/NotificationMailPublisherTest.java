package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.lenient;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.mars.dto.NotificationResponse;
import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.mail.TemplateMailRequest;
import com.mars.dto.mail.MailDetail;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentRescheduleApproval;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.enums.MeetingType;
import com.mars.enums.NotificationType;

@ExtendWith(MockitoExtension.class)
class NotificationMailPublisherTest {
    @Mock private MailService mailService;
    @Mock private EmailNotificationPreferenceService preferenceService;
    @InjectMocks private NotificationMailPublisher publisher;

    @BeforeEach
    void enableEmailByDefault() {
        lenient().when(preferenceService.isEnabled(org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.nullable(NotificationType.class))).thenReturn(true);
    }

    @AfterEach
    void cleanupSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void publishWithoutTransaction_sendsNotificationTemplateImmediately() {
        NotificationResponse notification = NotificationResponse.builder()
                .title("Randevu Onaylandı")
                .message("Randevunuz onaylandı.")
                .build();

        publisher.publishAfterCommit("student@mars.edu.tr", 7, notification, null, null, null,
                NotificationCreateRequest.builder().build());

        verify(mailService).sendTemplate(argThat(request ->
                request.recipient().equals("student@mars.edu.tr")
                        && request.subject().equals("Randevu Onaylandı")
                        && request.content().equals("Randevunuz onaylandı.")));
    }

    @Test
    void publishWithTransaction_waitsUntilCommit() {
        TransactionSynchronizationManager.initSynchronization();
        NotificationResponse notification = NotificationResponse.builder()
                .title("Delegasyon Talebi")
                .message("Yeni delegasyon talebiniz var.")
                .build();

        publisher.publishAfterCommit("assistant@mars.edu.tr", 8, notification, null, null, null,
                NotificationCreateRequest.builder().build());

        verify(mailService, never()).sendTemplate(org.mockito.ArgumentMatchers.any(TemplateMailRequest.class));
        TransactionSynchronizationManager.getSynchronizations().forEach(
                org.springframework.transaction.support.TransactionSynchronization::afterCommit);
        verify(mailService).sendTemplate(org.mockito.ArgumentMatchers.any(TemplateMailRequest.class));
    }

    @Test
    void disabledPreference_skipsOnlyMailPublishing() {
        NotificationResponse notification = NotificationResponse.builder()
                .notificationType(NotificationType.APPOINTMENT_APPROVED)
                .title("Randevu Onaylandı")
                .message("Randevunuz onaylandı.")
                .build();
        org.mockito.Mockito.when(preferenceService.isEnabled(7, NotificationType.APPOINTMENT_APPROVED))
                .thenReturn(false);

        publisher.publishAfterCommit("student@mars.edu.tr", 7, notification, null, null, null,
                NotificationCreateRequest.builder().build());

        verify(mailService, never()).sendTemplate(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void publishAppointment_buildsStructuredDetailsAndOmitsMissingCourse() {
        User student = new User();
        student.setFullName("Elif Kaya");
        User staff = new User();
        staff.setFullName("Dr. Deniz Yılmaz");
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotDate(LocalDate.of(2026, 7, 24));
        slot.setStartTime(LocalTime.of(14, 30));
        slot.setEndTime(LocalTime.of(15, 0));
        AppointmentCategory category = new AppointmentCategory();
        category.setCategoryName("Bitirme Projesi Görüşmesi");
        Appointment appointment = new Appointment();
        appointment.setStudent(student);
        appointment.setStaff(staff);
        appointment.setSlot(slot);
        appointment.setCategory(category);
        appointment.setMeetingType(MeetingType.FACE_TO_FACE.name());
        NotificationResponse notification = NotificationResponse.builder()
                .title("Randevu Onaylandı")
                .message("Randevunuz onaylandı.")
                .build();

        publisher.publishAfterCommit("student@mars.edu.tr", 7, notification, appointment, null, null,
                NotificationCreateRequest.builder().build());

        ArgumentCaptor<TemplateMailRequest> captor = ArgumentCaptor.forClass(TemplateMailRequest.class);
        verify(mailService).sendTemplate(captor.capture());
        var details = (java.util.List<MailDetail>) captor.getValue().parameters().get("details");
        assertThat(details)
                .contains(new MailDetail("Öğrenci", "Elif Kaya"))
                .contains(new MailDetail("Randevu Tarihi", "24.07.2026"))
                .contains(new MailDetail("Başlangıç Saati", "14:30"))
                .contains(new MailDetail("Bitiş Saati", "15:00"))
                .contains(new MailDetail("Görüşme Türü", "Yüz Yüze"))
                .contains(new MailDetail("Kategori", "Bitirme Projesi Görüşmesi"))
                .noneMatch(detail -> detail.label().equals("Ders"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void publishRescheduleRequest_showsOldAndNewSlotsWithPendingPresentation() {
        Appointment appointment = new Appointment();
        appointment.setMeetingType(MeetingType.FACE_TO_FACE.name());
        AvailabilitySlot original = slot(LocalDate.of(2026, 7, 24), LocalTime.of(14, 30), LocalTime.of(15, 0));
        AvailabilitySlot proposed = slot(LocalDate.of(2026, 7, 25), LocalTime.of(10, 0), LocalTime.of(10, 30));
        AppointmentRescheduleApproval reschedule = new AppointmentRescheduleApproval();
        reschedule.setOriginalSlot(original);
        reschedule.setProposedSlot(proposed);
        reschedule.setProposedMeetingType(MeetingType.ONLINE.name());
        NotificationResponse notification = NotificationResponse.builder()
                .notificationType(NotificationType.APPOINTMENT_RESCHEDULE_REQUESTED)
                .title("Yeniden Planlama Talebi")
                .message("Yeni tarih teklif edildi.")
                .build();

        publisher.publishAfterCommit("student@mars.edu.tr", 7, notification, appointment, null, reschedule,
                NotificationCreateRequest.builder().build());

        ArgumentCaptor<TemplateMailRequest> captor = ArgumentCaptor.forClass(TemplateMailRequest.class);
        verify(mailService).sendTemplate(captor.capture());
        TemplateMailRequest request = captor.getValue();
        var details = (java.util.List<MailDetail>) request.parameters().get("details");
        assertThat(details)
                .contains(new MailDetail("Eski Tarih", "24.07.2026"))
                .contains(new MailDetail("Eski Saat", "14:30 - 15:00"))
                .contains(new MailDetail("Yeni Tarih", "25.07.2026"))
                .contains(new MailDetail("Yeni Saat", "10:00 - 10:30"))
                .contains(new MailDetail("Görüşme Türü", "Online"));
        assertThat(request.parameters())
                .containsEntry("statusText", "ONAY BEKLİYOR")
                .containsEntry("showSubtitle", true);
    }

    private AvailabilitySlot slot(LocalDate date, LocalTime start, LocalTime end) {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotDate(date);
        slot.setStartTime(start);
        slot.setEndTime(end);
        return slot;
    }
}
