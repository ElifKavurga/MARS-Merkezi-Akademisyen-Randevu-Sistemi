package com.mars.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.mars.AppointmentMessages;
import com.mars.dto.StudentAppointmentRestrictionResponse;
import com.mars.dto.StudentPenaltyStatusResponse;
import com.mars.dto.notification.NoShowNotificationRequest;
import com.mars.dto.notification.PenaltyNotificationRequest;
import com.mars.entity.Appointment;
import com.mars.entity.PenaltyRule;
import com.mars.entity.StudentPenaltyStatus;
import com.mars.entity.User;
import com.mars.enums.AppointmentErrorCode;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.PenaltyNotificationEvent;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.PenaltyRuleRepository;
import com.mars.repository.StudentPenaltyStatusRepository;

import jakarta.persistence.EntityManager;
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
    private final EntityManager entityManager;
    
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
        processPenaltyAndNotifications(appointment, now);

        return appointment;
    }

    private void processPenaltyAndNotifications(Appointment appointment, LocalDateTime now) {
        if (appointment == null || !AppointmentStatus.NO_SHOW.name().equals(appointment.getAppointmentStatus())) {
            return;
        }

        User student = appointment.getStudent();
        StudentPenaltyStatus penaltyStatus = studentPenaltyStatusRepository.findById(student.getUserId())
                .orElseGet(() -> newPenaltyStatus(student, resolvePenaltyRule()));

        int currentNoShowCount = penaltyStatus.getTotalNoShowCount() == null
                ? 0
                : penaltyStatus.getTotalNoShowCount();
        long historicalNoShowCount = appointmentRepository.countByStudent_UserIdAndAppointmentStatus(
                student.getUserId(), AppointmentStatus.NO_SHOW.name());
        int synchronizedNoShowCount = (int) Math.min(
                Integer.MAX_VALUE,
                Math.max(currentNoShowCount + 1L, historicalNoShowCount));
        penaltyStatus.setTotalNoShowCount(synchronizedNoShowCount);

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
                appointment.getAppointmentId(),
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
                LOGGER.error("Failed to send missed appointment notifications for appointmentId={}",
                        appointment.getAppointmentId(), e);
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

    @Transactional
    public Optional<StudentAppointmentRestrictionResponse> resolveActiveRestriction(User student, LocalDate today) {
        StudentPenaltyStatus status = resolveCurrentPenaltyStatus(student, today);
        if (!Boolean.TRUE.equals(status.getIsRestricted())) {
            return Optional.empty();
        }
        return Optional.of(toRestrictionResponse(status, today));
    }

    @Transactional
    public StudentPenaltyStatusResponse getStudentPenaltyStatus(User student, LocalDate today) {
        StudentPenaltyStatus status = resolveCurrentPenaltyStatus(student, today);
        PenaltyRule rule = status.getPenaltyRule() == null ? resolvePenaltyRule() : status.getPenaltyRule();
        boolean active = Boolean.TRUE.equals(status.getIsRestricted());
        return StudentPenaltyStatusResponse.builder()
                .penaltyActive(active)
                .totalNoShowCount(status.getTotalNoShowCount() == null ? 0 : status.getTotalNoShowCount())
                .maxNoShowCount(resolveMaxNoShowCount(rule))
                .remainingDays(active ? calculateRemainingPenaltyDays(today, status.getRestrictionEndDate()) : null)
                .restrictionEndDate(active ? status.getRestrictionEndDate() : null)
                .penaltyDurationDays(resolveBanDurationDays(rule))
                .build();
    }

    private StudentPenaltyStatus resolveCurrentPenaltyStatus(User student, LocalDate today) {
        PenaltyRule rule = resolvePenaltyRule();
        Optional<StudentPenaltyStatus> existing = studentPenaltyStatusRepository.findById(student.getUserId());
        StudentPenaltyStatus status = existing.orElseGet(() -> {
            long historicalNoShowCount = appointmentRepository.countByStudent_UserIdAndAppointmentStatus(
                    student.getUserId(), AppointmentStatus.NO_SHOW.name());
            StudentPenaltyStatus newStatus = newPenaltyStatus(student, rule);
            newStatus.setTotalNoShowCount((int) Math.min(Integer.MAX_VALUE, historicalNoShowCount));
            return newStatus;
        });

        if (status.getPenaltyRule() == null) {
            status.setPenaltyRule(rule);
        }

        if (Boolean.TRUE.equals(status.getIsRestricted())) {
            LocalDate endDate = status.getRestrictionEndDate();
            if (endDate != null && endDate.isBefore(today)) {
                clearExpiredPenalty(status);
                return studentPenaltyStatusRepository.save(status);
            }
            return status;
        }

        int trackedNoShowCount = status.getTotalNoShowCount() == null ? 0 : status.getTotalNoShowCount();
        long historicalNoShowCount = appointmentRepository.countByStudent_UserIdAndAppointmentStatus(
                student.getUserId(), AppointmentStatus.NO_SHOW.name());
        trackedNoShowCount = (int) Math.min(Integer.MAX_VALUE, Math.max(trackedNoShowCount, historicalNoShowCount));
        status.setTotalNoShowCount(trackedNoShowCount);

        if (Boolean.TRUE.equals(status.getPenaltyRule().getIsActive())
                && trackedNoShowCount >= resolveMaxNoShowCount(status.getPenaltyRule())) {
            status.setIsRestricted(true);
            status.setRestrictionStartDate(today);
            status.setRestrictionEndDate(today.plusDays(resolveBanDurationDays(status.getPenaltyRule())));
        }

        if (existing.isEmpty() && trackedNoShowCount == 0 && !Boolean.TRUE.equals(status.getIsRestricted())) {
            return status;
        }
        return studentPenaltyStatusRepository.save(status);
    }

    private StudentPenaltyStatus newPenaltyStatus(User student, PenaltyRule rule) {
        StudentPenaltyStatus newStatus = new StudentPenaltyStatus();
        newStatus.setStudentId(student.getUserId());
        newStatus.setStudent(entityManager.getReference(User.class, student.getUserId()));
        newStatus.setIsRestricted(false);
        newStatus.setTotalNoShowCount(0);
        newStatus.setPenaltyRule(rule);
        newStatus.markNew();
        return newStatus;
    }

    private StudentAppointmentRestrictionResponse toRestrictionResponse(
            StudentPenaltyStatus status,
            LocalDate today) {
        PenaltyRule rule = status.getPenaltyRule() == null ? resolvePenaltyRule() : status.getPenaltyRule();
        return StudentAppointmentRestrictionResponse.builder()
                .errorCode(AppointmentErrorCode.STUDENT_RESTRICTED)
                .penaltyActive(true)
                .remainingDays(calculateRemainingPenaltyDays(today, status.getRestrictionEndDate()))
                .restrictionEndDate(status.getRestrictionEndDate())
                .penaltyDurationDays(resolveBanDurationDays(rule))
                .build();
    }

    private int resolveMaxNoShowCount(PenaltyRule rule) {
        return rule.getMaxNoShowCount() == null || rule.getMaxNoShowCount() <= 0
                ? DEFAULT_MAX_NO_SHOW_COUNT
                : rule.getMaxNoShowCount();
    }

    private int resolveBanDurationDays(PenaltyRule rule) {
        return rule.getBanDurationDays() == null || rule.getBanDurationDays() <= 0
                ? DEFAULT_BAN_DURATION_DAYS
                : rule.getBanDurationDays();
    }

    private Integer calculateRemainingPenaltyDays(LocalDate today, LocalDate endDate) {
        if (endDate == null) {
            return null;
        }
        return (int) Math.max(0, ChronoUnit.DAYS.between(today, endDate));
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
        clearExpiredPenalty(status);
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

    private void clearExpiredPenalty(StudentPenaltyStatus status) {
        status.setIsRestricted(false);
        status.setRestrictionStartDate(null);
        status.setRestrictionEndDate(null);
        status.setTotalNoShowCount(0); // Reset count upon penalty completion
    }
}
