package com.mars.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.mars.AppointmentMessages;
import com.mars.dto.notification.NoShowNotificationRequest;
import com.mars.dto.notification.PenaltyNotificationRequest;
import com.mars.entity.Appointment;
import com.mars.entity.PenaltyRule;
import com.mars.entity.StudentPenaltyStatus;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.PenaltyNotificationEvent;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.PenaltyRuleRepository;
import com.mars.repository.StudentPenaltyStatusRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoShowPenaltyService {

    private static final Logger LOGGER = LoggerFactory.getLogger(NoShowPenaltyService.class);
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final int DEFAULT_MAX_NO_SHOW_COUNT = 3;
    private static final int DEFAULT_BAN_DURATION_DAYS = 7;
    private static final Set<String> ACTIVE_STATUSES = Set.of(
            AppointmentStatus.APPROVED.name()
    );

    private final AppointmentRepository appointmentRepository;
    private final StudentPenaltyStatusRepository studentPenaltyStatusRepository;
    private final PenaltyRuleRepository penaltyRuleRepository;
    private final PlatformTransactionManager transactionManager;
    
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
                LOGGER.error("Failed to automatically mark appointment as missed. appointmentId={}, error={}",
                        appointmentId, e.getMessage(), e);
            }
        }
        return count;
    }

    @Transactional
    public Appointment markStaffAppointmentAsNoShow(Integer appointmentId, Integer staffId, LocalDateTime now) {
        Appointment appointment = markAsNoShow(appointmentId, now, staffId, true);
        if (appointment == null) {
            throw new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND);
        }
        return appointment;
    }

    private boolean markAsNoShow(Integer appointmentId, LocalDateTime now) {
        return markAsNoShow(appointmentId, now, null, false) != null;
    }

    private Appointment markAsNoShow(
            Integer appointmentId,
            LocalDateTime now,
            Integer requiredStaffId,
            boolean failOnInvalidStatus) {
        Appointment appointment = appointmentRepository.findByIdForUpdate(appointmentId).orElse(null);
        if (appointment == null) {
            return null;
        }

        if (requiredStaffId != null && !Objects.equals(appointment.getStaff().getUserId(), requiredStaffId)) {
            throw new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND);
        }

        String currentStatus = appointment.getAppointmentStatus();
        if (!ACTIVE_STATUSES.contains(currentStatus)) {
            if (failOnInvalidStatus) {
                throw new ConflictException(AppointmentMessages.END_NOT_APPROVED);
            }
            return null;
        }

        appointment.setAppointmentStatus(AppointmentStatus.NO_SHOW.name());
        if (requiredStaffId != null) {
            appointment.setNoShowMarkedByUser(appointment.getStaff());
        }
        appointment.setUpdatedAt(now);
        appointmentRepository.save(appointment);
        runAfterCommitInNewTransaction(() -> processPenaltyAndNotifications(appointmentId, now));

        return appointment;
    }

    private void processPenaltyAndNotifications(Integer appointmentId, LocalDateTime now) {
        Appointment appointment = appointmentRepository.findByIdForUpdate(appointmentId).orElse(null);
        if (appointment == null || !AppointmentStatus.NO_SHOW.name().equals(appointment.getAppointmentStatus())) {
            return;
        }

        User student = appointment.getStudent();
        StudentPenaltyStatus penaltyStatus = studentPenaltyStatusRepository.findById(student.getUserId())
                .orElseGet(() -> {
                    StudentPenaltyStatus newStatus = new StudentPenaltyStatus();
                    newStatus.setStudentId(student.getUserId());
                    newStatus.setStudent(student);
                    newStatus.setIsRestricted(false);
                    newStatus.setTotalNoShowCount(0);
                    newStatus.setPenaltyRule(resolvePenaltyRule());
                    return newStatus;
                });

        int currentNoShowCount = penaltyStatus.getTotalNoShowCount() == null
                ? 0
                : penaltyStatus.getTotalNoShowCount();
        penaltyStatus.setTotalNoShowCount(currentNoShowCount + 1);

        PenaltyRule rule = penaltyStatus.getPenaltyRule();
        if (rule == null) {
            rule = resolvePenaltyRule();
            penaltyStatus.setPenaltyRule(rule);
        }
        int maxNoShowCount = rule.getMaxNoShowCount() == null || rule.getMaxNoShowCount() <= 0
                ? DEFAULT_MAX_NO_SHOW_COUNT
                : rule.getMaxNoShowCount();
        int banDurationDays = rule.getBanDurationDays() == null || rule.getBanDurationDays() <= 0
                ? DEFAULT_BAN_DURATION_DAYS
                : rule.getBanDurationDays();

        boolean penaltyApplied = false;
        if (Boolean.TRUE.equals(rule.getIsActive()) && !Boolean.TRUE.equals(penaltyStatus.getIsRestricted())) {
            if (penaltyStatus.getTotalNoShowCount() >= maxNoShowCount) {
                penaltyStatus.setIsRestricted(true);
                penaltyStatus.setRestrictionStartDate(now.toLocalDate());
                penaltyStatus.setRestrictionEndDate(now.toLocalDate().plusDays(banDurationDays));
                penaltyApplied = true;
            }
        }

        studentPenaltyStatusRepository.save(penaltyStatus);

        String nextProc = penaltyApplied 
                ? "Mevcut ceza kuralları kapsamında randevu almanız geçici olarak kısıtlanmıştır."
                : "Mevcut ceza kuralları kapsamında takip edilmektedir.";
        NoShowNotificationRequest noShowNotification = new NoShowNotificationRequest(
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
        );
        runAfterCommit(() -> {
            try {
                noShowNotificationPublisher.publish(noShowNotification);
            } catch (Exception e) {
                LOGGER.error("Failed to send missed appointment notifications for appointmentId={}", appointmentId, e);
            }
        });

        if (penaltyApplied) {
            PenaltyNotificationRequest penaltyNotification = new PenaltyNotificationRequest(
                    student.getUserId(),
                    student.getUserId(),
                    PenaltyNotificationEvent.APPLIED,
                    student.getFullName(),
                    "Randevuya katılmama limiti aşıldı (" + maxNoShowCount + " kez katılım sağlanmadı)",
                    penaltyStatus.getRestrictionStartDate(),
                    penaltyStatus.getRestrictionEndDate(),
                    banDurationDays
            );
            runAfterCommit(() -> {
                try {
                    penaltyNotificationPublisher.publish(penaltyNotification);
                } catch (Exception e) {
                LOGGER.error("Failed to send Penalty Applied notification for studentId={}", student.getUserId(), e);
            }
        });
        }
    }

    private PenaltyRule resolvePenaltyRule() {
        return penaltyRuleRepository.findFirstByOrderByPenaltyRuleIdAsc()
                .orElseGet(() -> {
                    PenaltyRule defaultRule = new PenaltyRule();
                    defaultRule.setMaxNoShowCount(DEFAULT_MAX_NO_SHOW_COUNT);
                    defaultRule.setBanDurationDays(DEFAULT_BAN_DURATION_DAYS);
                    defaultRule.setIsActive(true);
                    return penaltyRuleRepository.save(defaultRule);
                });
    }

    private void runAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    private void runAfterCommitInNewTransaction(Runnable action) {
        runAfterCommit(() -> {
            try {
                new TransactionTemplate(transactionManager).executeWithoutResult(status -> action.run());
            } catch (Exception e) {
                LOGGER.error("Failed to process missed appointment side effects.", e);
            }
        });
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
                    "Ceza süresi doldu",
                    null,
                    null,
                    null
            ));
        } catch (Exception e) {
            LOGGER.error("Failed to send Penalty Lifted notification for studentId={}", status.getStudentId(), e);
        }
    }
}
