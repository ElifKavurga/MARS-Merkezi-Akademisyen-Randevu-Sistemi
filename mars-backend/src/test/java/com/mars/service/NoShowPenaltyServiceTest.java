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

import com.mars.dto.notification.NoShowNotificationRequest;
import com.mars.dto.notification.PenaltyNotificationRequest;
import com.mars.entity.*;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.PenaltyNotificationEvent;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.PenaltyRuleRepository;
import com.mars.repository.StudentPenaltyStatusRepository;

import jakarta.persistence.EntityManager;

@ExtendWith(MockitoExtension.class)
class NoShowPenaltyServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private StudentPenaltyStatusRepository studentPenaltyStatusRepository;
    @Mock
    private PenaltyRuleRepository penaltyRuleRepository;
    @Mock
    private EntityManager entityManager;
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
                entityManager,
                noShowNotificationPublisher,
                penaltyNotificationPublisher
        );
        now = LocalDateTime.of(2026, 7, 23, 14, 0);
        lenient().when(entityManager.getReference(eq(User.class), anyInt()))
                .thenAnswer(invocation -> {
                    User student = new User();
                    student.setUserId(invocation.getArgument(1));
                    return student;
                });
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
    void resolveActiveRestriction_missingStatus_backfillsFromNoShowAppointments() {
        User student = new User();
        student.setUserId(10);
        student.setFullName("Restricted Student");

        PenaltyRule rule = new PenaltyRule();
        rule.setPenaltyRuleId(1);
        rule.setMaxNoShowCount(3);
        rule.setBanDurationDays(7);
        rule.setIsActive(true);

        when(penaltyRuleRepository.findFirstByOrderByPenaltyRuleIdAsc())
                .thenReturn(Optional.of(rule));
        when(studentPenaltyStatusRepository.findById(10)).thenReturn(Optional.empty());
        when(appointmentRepository.countByStudent_UserIdAndAppointmentStatus(10, AppointmentStatus.NO_SHOW.name()))
                .thenReturn(5L);
        when(studentPenaltyStatusRepository.save(any(StudentPenaltyStatus.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Optional<com.mars.dto.StudentAppointmentRestrictionResponse> restriction =
                service.resolveActiveRestriction(student, now.toLocalDate());

        assertThat(restriction).isPresent();
        assertThat(restriction.get().getPenaltyActive()).isTrue();
        assertThat(restriction.get().getRemainingDays()).isEqualTo(7);
        assertThat(restriction.get().getRestrictionEndDate()).isEqualTo(now.toLocalDate().plusDays(7));
        verify(studentPenaltyStatusRepository).save(argThat(status ->
                Boolean.TRUE.equals(status.getIsRestricted())
                        && status.getTotalNoShowCount() == 5
                        && status.getRestrictionEndDate().equals(now.toLocalDate().plusDays(7))));
    }

    @Test
    void resolveActiveRestriction_existingZeroStatus_backfillsFromNoShowAppointments() {
        User student = new User();
        student.setUserId(10);
        student.setFullName("Restricted Student");

        PenaltyRule rule = new PenaltyRule();
        rule.setPenaltyRuleId(1);
        rule.setMaxNoShowCount(3);
        rule.setBanDurationDays(7);
        rule.setIsActive(true);

        StudentPenaltyStatus staleStatus = new StudentPenaltyStatus();
        staleStatus.setStudentId(student.getUserId());
        staleStatus.setStudent(student);
        staleStatus.setIsRestricted(false);
        staleStatus.setTotalNoShowCount(0);
        staleStatus.setPenaltyRule(rule);

        when(penaltyRuleRepository.findFirstByOrderByPenaltyRuleIdAsc())
                .thenReturn(Optional.of(rule));
        when(studentPenaltyStatusRepository.findById(10)).thenReturn(Optional.of(staleStatus));
        when(appointmentRepository.countByStudent_UserIdAndAppointmentStatus(10, AppointmentStatus.NO_SHOW.name()))
                .thenReturn(5L);
        when(studentPenaltyStatusRepository.save(any(StudentPenaltyStatus.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Optional<com.mars.dto.StudentAppointmentRestrictionResponse> restriction =
                service.resolveActiveRestriction(student, now.toLocalDate());

        assertThat(restriction).isPresent();
        assertThat(staleStatus.getTotalNoShowCount()).isEqualTo(5);
        assertThat(staleStatus.getIsRestricted()).isTrue();
        assertThat(staleStatus.getRestrictionEndDate()).isEqualTo(now.toLocalDate().plusDays(7));
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
