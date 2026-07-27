package com.mars.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.notification.NoShowNotificationRequest;
import com.mars.dto.notification.PenaltyNotificationRequest;
import com.mars.entity.Appointment;
import com.mars.entity.PenaltyRule;
import com.mars.entity.StudentPenaltyStatus;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.PenaltyNotificationEvent;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.PenaltyRuleRepository;
import com.mars.repository.StudentPenaltyStatusRepository;
import com.mars.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoShowPenaltyService {

    private static final Logger LOGGER = LoggerFactory.getLogger(NoShowPenaltyService.class);
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final Set<String> ACTIVE_STATUSES = Set.of(
            AppointmentStatus.APPROVED.name()
    );

    private final AppointmentRepository appointmentRepository;
    private final StudentPenaltyStatusRepository studentPenaltyStatusRepository;
    private final PenaltyRuleRepository penaltyRuleRepository;
    
    private final NoShowNotificationPublisher noShowNotificationPublisher;
    private final PenaltyNotificationPublisher penaltyNotificationPublisher;

    @Transactional
    public int processNoShows(LocalDateTime now) {
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        List<Integer> candidateIds = appointmentRepository.findStatusUpdateCandidateIds(
                ACTIVE_STATUSES,
                today,
                currentTime,
                PageRequest.of(0, 100)
        );

        if (candidateIds.isEmpty()) {
            return 0;
        }

        int count = 0;
        for (Integer appointmentId : candidateIds) {
            try {
                if (markAsNoShow(appointmentId, now)) {
                    count++;
                }
            } catch (Exception e) {
                LOGGER.error("Failed to automatically mark appointment as No-Show. appointmentId={}, error={}",
                        appointmentId, e.getMessage(), e);
            }
        }
        return count;
    }

    private boolean markAsNoShow(Integer appointmentId, LocalDateTime now) {
        Appointment appointment = appointmentRepository.findByIdForUpdate(appointmentId).orElse(null);
        if (appointment == null) {
            return false;
        }

        String currentStatus = appointment.getAppointmentStatus();
        if (!ACTIVE_STATUSES.contains(currentStatus)) {
            return false;
        }

        appointment.setAppointmentStatus(AppointmentStatus.NO_SHOW.name());
        appointment.setUpdatedAt(now);
        appointmentRepository.save(appointment);

        User student = appointment.getStudent();
        StudentPenaltyStatus penaltyStatus = studentPenaltyStatusRepository.findById(student.getUserId())
                .orElseGet(() -> {
                    StudentPenaltyStatus newStatus = new StudentPenaltyStatus();
                    newStatus.setStudentId(student.getUserId());
                    newStatus.setStudent(student);
                    newStatus.setIsRestricted(false);
                    newStatus.setTotalNoShowCount(0);
                    PenaltyRule activeRule = penaltyRuleRepository.findFirstByOrderByPenaltyRuleIdAsc()
                            .orElseThrow(() -> new IllegalStateException("No active penalty rule found"));
                    newStatus.setPenaltyRule(activeRule);
                    return newStatus;
                });

        penaltyStatus.setTotalNoShowCount(penaltyStatus.getTotalNoShowCount() + 1);

        PenaltyRule rule = penaltyStatus.getPenaltyRule();
        boolean penaltyApplied = false;
        if (Boolean.TRUE.equals(rule.getIsActive()) && !Boolean.TRUE.equals(penaltyStatus.getIsRestricted())) {
            if (penaltyStatus.getTotalNoShowCount() >= rule.getMaxNoShowCount()) {
                penaltyStatus.setIsRestricted(true);
                penaltyStatus.setRestrictionStartDate(now.toLocalDate());
                penaltyStatus.setRestrictionEndDate(now.toLocalDate().plusDays(rule.getBanDurationDays()));
                penaltyApplied = true;
            }
        }

        studentPenaltyStatusRepository.save(penaltyStatus);

        // Publish No-Show Notification
        String nextProc = penaltyApplied 
                ? "Mevcut ceza kurallarÃ„Â± kapsamÃ„Â±nda randevu almanÃ„Â±z geÃƒÂ§ici olarak kÃ„Â±sÃ„Â±tlanmÃ„Â±Ã…Å¸tÃ„Â±r."
                : "Mevcut ceza kurallarÃ„Â± kapsamÃ„Â±nda takip edilmektedir.";
        try {
            noShowNotificationPublisher.publish(new NoShowNotificationRequest(
                    student.getUserId(),
                    appointment.getStaff().getUserId(),
                    appointmentId,
                    student.getFullName(),
                    appointment.getStaff().getFullName(),
                    appointment.getSlot().getSlotDate(),
                    appointment.getSlot().getStartTime(),
                    appointment.getSlot().getEndTime(),
                    appointment.getCategory().getCategoryName(),
                    appointment.getCourse() != null ? appointment.getCourse().getCourseCode() : null,
                    nextProc
            ));
        } catch (Exception e) {
            LOGGER.error("Failed to send No-Show notifications for appointmentId={}", appointmentId, e);
        }

        // Publish Penalty applied Notification
        if (penaltyApplied) {
            try {
                penaltyNotificationPublisher.publish(new PenaltyNotificationRequest(
                        student.getUserId(),
                        student.getUserId(), // Using student ID as the reference as well
                        PenaltyNotificationEvent.APPLIED,
                        student.getFullName(),
                        "No-Show limiti aÃ…Å¸Ã„Â±ldÃ„Â± (" + rule.getMaxNoShowCount() + " kez katÃ„Â±lÃ„Â±m saÃ„Å¸lanmadÃ„Â±)",
                        penaltyStatus.getRestrictionStartDate(),
                        penaltyStatus.getRestrictionEndDate(),
                        rule.getBanDurationDays()
                ));
            } catch (Exception e) {
                LOGGER.error("Failed to send Penalty Applied notification for studentId={}", student.getUserId(), e);
            }
        }

        return true;
    }

    @Transactional
    public int liftExpiredPenalties(LocalDate today) {
        List<StudentPenaltyStatus> restrictedList = studentPenaltyStatusRepository.findAll();
        int count = 0;
        for (StudentPenaltyStatus status : restrictedList) {
            if (Boolean.TRUE.equals(status.getIsRestricted()) && status.getRestrictionEndDate() != null) {
                if (status.getRestrictionEndDate().isBefore(today)) {
                    try {
                        liftPenalty(status);
                        count++;
                    } catch (Exception e) {
                        LOGGER.error("Failed to lift penalty for studentId={}", status.getStudentId(), e);
                    }
                }
            }
        }
        return count;
    }

    private void liftPenalty(StudentPenaltyStatus status) {
        status.setIsRestricted(false);
        status.setRestrictionStartDate(null);
        status.setRestrictionEndDate(null);
        status.setTotalNoShowCount(0); // Reset count upon penalty completion
        studentPenaltyStatusRepository.save(status);

        try {
            penaltyNotificationPublisher.publish(new PenaltyNotificationRequest(
                    status.getStudent().getUserId(),
                    status.getStudent().getUserId(),
                    PenaltyNotificationEvent.LIFTED,
                    status.getStudent().getFullName(),
                    "Ceza sÃƒÂ¼resi doldu",
                    null,
                    null,
                    null
            ));
        } catch (Exception e) {
            LOGGER.error("Failed to send Penalty Lifted notification for studentId={}", status.getStudentId(), e);
        }
    }
}
