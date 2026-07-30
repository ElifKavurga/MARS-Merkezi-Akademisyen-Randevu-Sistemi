package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import com.mars.dto.notification.NoShowNotificationRequest;
import com.mars.dto.notification.PenaltyNotificationRequest;
import com.mars.entity.*;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.PenaltyNotificationEvent;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.PenaltyRuleRepository;
import com.mars.repository.StudentPenaltyStatusRepository;

@ExtendWith(MockitoExtension.class)
class NoShowPenaltyServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private StudentPenaltyStatusRepository studentPenaltyStatusRepository;
    @Mock
    private PenaltyRuleRepository penaltyRuleRepository;
    @Mock
    private PlatformTransactionManager transactionManager;
    @Mock
    private NoShowNotificationPublisher noShowNotificationPublisher;
    @Mock
    private PenaltyNotificationPublisher penaltyNotificationPublisher;

    private NoShowPenaltyService service;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        service = new NoShowPenaltyService(
                appointmentRepository,
                studentPenaltyStatusRepository,
                penaltyRuleRepository,
                transactionManager,
                noShowNotificationPublisher,
                penaltyNotificationPublisher
        );
        lenient().when(transactionManager.getTransaction(any()))
                .thenReturn(new SimpleTransactionStatus());
        now = LocalDateTime.of(2026, 7, 23, 14, 0);
    }

    @Test
    void processNoShows_noCandidate_doesNothing() {
        when(appointmentRepository.findStatusUpdateCandidateIds(any(), any(), any(), any()))
                .thenReturn(List.of());

        int count = service.processNoShows(now);

        assertThat(count).isZero();
        verify(appointmentRepository, never()).findByIdForUpdate(anyInt());
    }

    @Test
    void processNoShows_withCandidate_marksAsNoShow_andAppliesPenalty() {
        // Setup slot & appointment
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotDate(now.minusMinutes(30).toLocalDate());
        slot.setStartTime(now.minusMinutes(30).toLocalTime());
        slot.setEndTime(now.minusMinutes(10).toLocalTime());

        User student = new User();
        student.setUserId(10);
        student.setFullName("Test Student");

        User staff = new User();
        staff.setUserId(20);
        staff.setFullName("Test Staff");

        AppointmentCategory category = new AppointmentCategory();
        category.setCategoryName("Office Hour");

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(1);
        appointment.setAppointmentStatus(AppointmentStatus.APPROVED.name());
        appointment.setSlot(slot);
        appointment.setStudent(student);
        appointment.setStaff(staff);
        appointment.setCategory(category);

        // Setup penalty rules
        PenaltyRule rule = new PenaltyRule();
        rule.setPenaltyRuleId(1);
        rule.setMaxNoShowCount(3);
        rule.setBanDurationDays(7);
        rule.setIsActive(true);

        StudentPenaltyStatus status = new StudentPenaltyStatus();
        status.setStudentId(student.getUserId());
        status.setStudent(student);
        status.setIsRestricted(false);
        status.setTotalNoShowCount(2); // One more will trigger restriction
        status.setPenaltyRule(rule);

        when(appointmentRepository.findStatusUpdateCandidateIds(any(), eq(now.toLocalDate()), eq(now.toLocalTime()), any()))
                .thenReturn(List.of(1));
        when(appointmentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(appointment));
        when(studentPenaltyStatusRepository.findById(10)).thenReturn(Optional.of(status));

        int count = service.processNoShows(now);

        assertThat(count).isEqualTo(1);
        assertThat(appointment.getAppointmentStatus()).isEqualTo(AppointmentStatus.NO_SHOW.name());
        assertThat(status.getTotalNoShowCount()).isEqualTo(3);
        assertThat(status.getIsRestricted()).isTrue();
        assertThat(status.getRestrictionStartDate()).isEqualTo(now.toLocalDate());
        assertThat(status.getRestrictionEndDate()).isEqualTo(now.toLocalDate().plusDays(7));

        verify(appointmentRepository).save(appointment);
        verify(studentPenaltyStatusRepository).save(status);
        verify(noShowNotificationPublisher).publish(any(NoShowNotificationRequest.class));
        verify(penaltyNotificationPublisher).publish(any(PenaltyNotificationRequest.class));
    }

    @Test
    void liftExpiredPenalties_liftsPenaltyCorrectly() {
        User student = new User();
        student.setUserId(10);
        student.setFullName("Restricted Student");

        StudentPenaltyStatus restrictedStatus = new StudentPenaltyStatus();
        restrictedStatus.setStudentId(10);
        restrictedStatus.setStudent(student);
        restrictedStatus.setIsRestricted(true);
        restrictedStatus.setRestrictionEndDate(now.toLocalDate().minusDays(1)); // expired yesterday

        when(studentPenaltyStatusRepository.findAll()).thenReturn(List.of(restrictedStatus));

        int lifted = service.liftExpiredPenalties(now.toLocalDate());

        assertThat(lifted).isEqualTo(1);
        assertThat(restrictedStatus.getIsRestricted()).isFalse();
        assertThat(restrictedStatus.getRestrictionStartDate()).isNull();
        assertThat(restrictedStatus.getRestrictionEndDate()).isNull();
        assertThat(restrictedStatus.getTotalNoShowCount()).isZero();

        verify(studentPenaltyStatusRepository).save(restrictedStatus);
        verify(penaltyNotificationPublisher).publish(argThat(req -> 
            req.event() == PenaltyNotificationEvent.LIFTED && req.recipientUserId().equals(10)
        ));

    }
}
