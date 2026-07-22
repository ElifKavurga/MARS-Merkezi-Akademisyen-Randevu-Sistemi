package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.mars.dto.mail.TemplateMailRequest;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AppointmentReminderDelivery;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.enums.AppointmentReminderType;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.repository.AppointmentReminderDeliveryRepository;
import com.mars.repository.AppointmentRepository;
import com.mars.service.mail.PublisherMailDetails;

@ExtendWith(MockitoExtension.class)
class AppointmentReminderServiceTest {
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private AppointmentReminderDeliveryRepository deliveryRepository;
    @Mock private MailService mailService;
    @Mock private EmailNotificationPreferenceService preferenceService;

    private AppointmentReminderService service;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        service = new AppointmentReminderService(
                appointmentRepository, deliveryRepository, mailService, preferenceService,
                new PublisherMailDetails(), 2);
        now = LocalDateTime.of(2026, 7, 22, 12, 0);
        org.mockito.Mockito.lenient().when(preferenceService.isReminderEnabled(anyInt())).thenReturn(true);
    }

    @Test
    void twentyFourHourReminder_sendsProfessionalMailToBothParticipantsOnce() {
        Appointment appointment = appointmentAt(now.plusHours(24).minusSeconds(30));
        when(appointmentRepository.findReminderCandidates(
                AppointmentStatus.APPROVED.name(), now.toLocalDate(), now.plusHours(24).toLocalDate()))
                .thenReturn(List.of(appointment));
        allowClaimsAndUpdates();
        when(mailService.sendTemplate(any())).thenReturn(true);

        service.sendDueReminders(now);

        ArgumentCaptor<TemplateMailRequest> captor = ArgumentCaptor.forClass(TemplateMailRequest.class);
        verify(mailService, times(2)).sendTemplate(captor.capture());
        assertThat(captor.getAllValues())
                .allMatch(request -> request.subject().equals("MARS Randevu Hatırlatması"))
                .allMatch(request -> request.parameters().get("statusText").equals("24 SAAT KALDI"));
        verify(deliveryRepository, times(2)).saveAndFlush(any(AppointmentReminderDelivery.class));
    }

    @Test
    void oneHourReminder_usesUrgentTitle() {
        Appointment appointment = appointmentAt(now.plusHours(1).minusSeconds(15));
        when(appointmentRepository.findReminderCandidates(anyString(), any(), any()))
                .thenReturn(List.of(appointment));
        allowClaimsAndUpdates();
        when(mailService.sendTemplate(any())).thenReturn(true);

        service.sendDueReminders(now);

        ArgumentCaptor<TemplateMailRequest> captor = ArgumentCaptor.forClass(TemplateMailRequest.class);
        verify(mailService, times(2)).sendTemplate(captor.capture());
        assertThat(captor.getAllValues())
                .allMatch(request -> request.subject().equals("Randevunuz 1 Saat Sonra Başlıyor"));
    }

    @Test
    void duplicateClaim_doesNotSendMail() {
        Appointment appointment = appointmentAt(now.plusHours(1).minusSeconds(15));
        when(appointmentRepository.findReminderCandidates(anyString(), any(), any()))
                .thenReturn(List.of(appointment));
        when(deliveryRepository.saveAndFlush(any()))
                .thenThrow(new DataIntegrityViolationException("duplicate"));

        service.sendDueReminders(now);

        verify(mailService, never()).sendTemplate(any());
    }

    @Test
    void failedRecipient_doesNotPreventOtherParticipantMail() {
        Appointment appointment = appointmentAt(now.plusHours(1).minusSeconds(15));
        when(appointmentRepository.findReminderCandidates(anyString(), any(), any()))
                .thenReturn(List.of(appointment));
        allowClaimsAndUpdates();
        when(mailService.sendTemplate(any())).thenReturn(false, true);

        service.sendDueReminders(now);

        verify(mailService, times(2)).sendTemplate(any());
    }

    @Test
    void disabledPreference_skipsClaimAndMailForThatRecipient() {
        Appointment appointment = appointmentAt(now.plusHours(1).minusSeconds(15));
        when(appointmentRepository.findReminderCandidates(anyString(), any(), any()))
                .thenReturn(List.of(appointment));
        when(preferenceService.isReminderEnabled(20)).thenReturn(false);
        when(preferenceService.isReminderEnabled(10)).thenReturn(true);
        when(deliveryRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(mailService.sendTemplate(any())).thenReturn(true);

        service.sendDueReminders(now);

        verify(deliveryRepository, times(1)).saveAndFlush(any(AppointmentReminderDelivery.class));
        verify(mailService, times(1)).sendTemplate(any());
    }

    private void allowClaimsAndUpdates() {
        when(deliveryRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(deliveryRepository.updateDeliveryStatus(
                anyInt(), anyInt(), any(AppointmentReminderType.class), anyString())).thenReturn(1);
    }

    private Appointment appointmentAt(LocalDateTime startsAt) {
        User student = new User();
        student.setUserId(20);
        student.setFullName("Elif Kaya");
        student.setInstitutionalEmail("student@mars.edu.tr");
        User staff = new User();
        staff.setUserId(10);
        staff.setFullName("Dr. Deniz Yılmaz");
        staff.setInstitutionalEmail("staff@mars.edu.tr");
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotDate(startsAt.toLocalDate());
        slot.setStartTime(startsAt.toLocalTime());
        slot.setEndTime(startsAt.plusMinutes(30).toLocalTime());
        AppointmentCategory category = new AppointmentCategory();
        category.setCategoryName("Bitirme Projesi Görüşmesi");
        Appointment appointment = new Appointment();
        appointment.setAppointmentId(100);
        appointment.setStudent(student);
        appointment.setStaff(staff);
        appointment.setSlot(slot);
        appointment.setCategory(category);
        appointment.setMeetingType(MeetingType.FACE_TO_FACE.name());
        appointment.setAppointmentStatus(AppointmentStatus.APPROVED.name());
        return appointment;
    }
}
