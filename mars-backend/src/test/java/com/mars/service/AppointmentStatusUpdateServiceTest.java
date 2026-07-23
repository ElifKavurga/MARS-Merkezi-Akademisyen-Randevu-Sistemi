package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import com.mars.entity.Appointment;
import com.mars.entity.AvailabilitySlot;
import com.mars.enums.AppointmentStatus;
import com.mars.repository.AppointmentRepository;

@ExtendWith(MockitoExtension.class)
class AppointmentStatusUpdateServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    private AppointmentStatusUpdateService service;
    private AppointmentStatusUpdateScheduler scheduler;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        service = new AppointmentStatusUpdateService(appointmentRepository);
        scheduler = new AppointmentStatusUpdateScheduler(service, 15);
        now = LocalDateTime.of(2026, 7, 23, 13, 0);
    }

    @Test
    void expiredApprovedAppointment_isCompleted() {
        Appointment appointment = createAppointment(1, AppointmentStatus.APPROVED.name(), now.minusMinutes(30));
        when(appointmentRepository.findStatusUpdateCandidateIds(any(), any(), any(), eq(PageRequest.of(0, 100))))
                .thenReturn(List.of(1));
        when(appointmentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(appointment));

        scheduler.runStatusUpdate();

        verify(appointmentRepository, times(1)).save(appointment);
        assertThat(appointment.getAppointmentStatus()).isEqualTo(AppointmentStatus.COMPLETED.name());
    }

    @Test
    void futureAppointment_isNotUpdated() {
        when(appointmentRepository.findStatusUpdateCandidateIds(any(), any(), any(), eq(PageRequest.of(0, 100))))
                .thenReturn(List.of());

        scheduler.runStatusUpdate();

        verify(appointmentRepository, never()).findByIdForUpdate(anyInt());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void completedCancelledOrRejectedAppointments_areNotProcessed() {
        Appointment completed = createAppointment(2, AppointmentStatus.COMPLETED.name(), now.minusMinutes(30));
        Appointment cancelled = createAppointment(3, AppointmentStatus.CANCELLED.name(), now.minusMinutes(30));
        Appointment rejected = createAppointment(4, AppointmentStatus.REJECTED.name(), now.minusMinutes(30));

        when(appointmentRepository.findByIdForUpdate(2)).thenReturn(Optional.of(completed));
        when(appointmentRepository.findByIdForUpdate(3)).thenReturn(Optional.of(cancelled));
        when(appointmentRepository.findByIdForUpdate(4)).thenReturn(Optional.of(rejected));

        boolean updatedCompleted = service.completeAppointment(2, now);
        boolean updatedCancelled = service.completeAppointment(3, now);
        boolean updatedRejected = service.completeAppointment(4, now);

        assertThat(updatedCompleted).isFalse();
        assertThat(updatedCancelled).isFalse();
        assertThat(updatedRejected).isFalse();

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void idempotentBehavior_onSecondRun() {
        Appointment appointment = createAppointment(1, AppointmentStatus.COMPLETED.name(), now.minusMinutes(30));
        when(appointmentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(appointment));

        boolean updated = service.completeAppointment(1, now);

        assertThat(updated).isFalse();
        verify(appointmentRepository, never()).save(any());
    }

    private Appointment createAppointment(Integer id, String status, LocalDateTime endTime) {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotDate(endTime.toLocalDate());
        slot.setStartTime(endTime.minusMinutes(30).toLocalTime());
        slot.setEndTime(endTime.toLocalTime());

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(id);
        appointment.setAppointmentStatus(status);
        appointment.setSlot(slot);
        appointment.setCreatedAt(now.minusHours(5));
        appointment.setUpdatedAt(now.minusHours(5));
        return appointment;
    }
}
