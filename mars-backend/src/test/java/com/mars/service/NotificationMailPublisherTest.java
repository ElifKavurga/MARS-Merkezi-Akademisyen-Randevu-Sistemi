package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.mars.dto.NotificationResponse;
import com.mars.dto.mail.TemplateMailRequest;
import com.mars.dto.mail.MailDetail;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.enums.MeetingType;

@ExtendWith(MockitoExtension.class)
class NotificationMailPublisherTest {
    @Mock private MailService mailService;
    @InjectMocks private NotificationMailPublisher publisher;

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

        publisher.publishAfterCommit("student@mars.edu.tr", notification, null, null);

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

        publisher.publishAfterCommit("assistant@mars.edu.tr", notification, null, null);

        verify(mailService, never()).sendTemplate(org.mockito.ArgumentMatchers.any(TemplateMailRequest.class));
        TransactionSynchronizationManager.getSynchronizations().forEach(
                org.springframework.transaction.support.TransactionSynchronization::afterCommit);
        verify(mailService).sendTemplate(org.mockito.ArgumentMatchers.any(TemplateMailRequest.class));
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

        publisher.publishAfterCommit("student@mars.edu.tr", notification, appointment, null);

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
}
