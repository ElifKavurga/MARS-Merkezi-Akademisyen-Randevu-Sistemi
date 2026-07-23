package com.mars.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mars.entity.Appointment;
import com.mars.enums.AppointmentStatus;
import com.mars.repository.AppointmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppointmentStatusUpdateService {

    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public List<Integer> findCandidates(LocalDateTime cutoffDateTime, Collection<String> statuses, int batchSize) {
        LocalDate cutoffDate = cutoffDateTime.toLocalDate();
        LocalTime cutoffTime = cutoffDateTime.toLocalTime();
        return appointmentRepository.findStatusUpdateCandidateIds(
                statuses,
                cutoffDate,
                cutoffTime,
                PageRequest.of(0, batchSize)
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean completeAppointment(Integer id, LocalDateTime now) {
        Appointment appointment = appointmentRepository.findByIdForUpdate(id).orElse(null);
        if (appointment == null) {
            return false;
        }

        String currentStatus = appointment.getAppointmentStatus();
        if (!"APPROVED".equals(currentStatus) && !"RESCHEDULED_APPROVED".equals(currentStatus)) {
            return false;
        }

        appointment.setAppointmentStatus(AppointmentStatus.COMPLETED.name());
        appointment.setUpdatedAt(now);
        appointmentRepository.save(appointment);
        return true;
    }
}
