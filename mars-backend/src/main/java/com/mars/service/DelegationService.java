package com.mars.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.DelegationMessages;
import com.mars.dto.CreateDelegationRequest;
import com.mars.dto.DelegationResponse;
import com.mars.entity.Appointment;
import com.mars.entity.DelegationLog;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.DelegationStatus;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.DelegationMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.repository.DelegationLogRepository;
import com.mars.repository.UserRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DelegationService {

    private static final Set<String> TERMINAL_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.CANCELLED.name(),
            AppointmentStatus.COMPLETED.name(),
            AppointmentStatus.NO_SHOW.name());

    private final DelegationLogRepository delegationLogRepository;
    private final AppointmentRepository appointmentRepository;
    private final CourseAssignmentRepository courseAssignmentRepository;
    private final UserRepository userRepository;
    private final DelegationMapper delegationMapper;

    @Transactional
    public DelegationResponse createDelegation(CreateDelegationRequest request) {
        User academician = getCurrentAcademician();

        if (request.getAppointmentId() == null) {
            throw new BadRequestException(DelegationMessages.APPOINTMENT_REQUIRED);
        }
        if (request.getAssistantId() == null) {
            throw new BadRequestException(DelegationMessages.ASSISTANT_REQUIRED);
        }

        Appointment appointment = appointmentRepository
                .findByIdWithStaffAndCourse(request.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.APPOINTMENT_NOT_FOUND));

        if (appointment.getStaff() == null
                || !Objects.equals(appointment.getStaff().getUserId(), academician.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.OWNERSHIP_DENIED);
        }

        validateAppointmentStatus(appointment.getAppointmentStatus());

        if (appointment.getCourse() == null || appointment.getCourse().getCourseId() == null) {
            throw new BadRequestException(DelegationMessages.COURSE_REQUIRED);
        }

        User assistant = userRepository.findByIdWithRoleAndDepartment(request.getAssistantId())
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.ASSISTANT_NOT_FOUND));

        if (!Boolean.TRUE.equals(assistant.getIsActive())) {
            throw new BadRequestException(DelegationMessages.ASSISTANT_INACTIVE);
        }
        if (assistant.getRole() == null
                || !RoleType.ASSISTANT.name().equals(assistant.getRole().getRoleName())) {
            throw new BadRequestException(DelegationMessages.ASSISTANT_ROLE_REQUIRED);
        }
        if (!courseAssignmentRepository.existsByCourse_CourseIdAndAssistant_UserId(
                appointment.getCourse().getCourseId(), assistant.getUserId())) {
            throw new BadRequestException(DelegationMessages.ASSISTANT_NOT_ASSIGNED);
        }

        if (delegationLogRepository.existsByAppointment_AppointmentIdAndDelegationStatus(
                appointment.getAppointmentId(), DelegationStatus.PENDING.name())) {
            throw new ConflictException(DelegationMessages.PENDING_EXISTS);
        }

        DelegationLog delegationLog = delegationMapper.toEntity(
                appointment,
                academician,
                assistant,
                LocalDateTime.now());
        DelegationLog saved = delegationLogRepository.save(delegationLog);
        return delegationMapper.toResponse(
                delegationLogRepository.findByIdWithDetails(saved.getDelegationId())
                        .orElse(saved));
    }

    @Transactional(readOnly = true)
    public List<DelegationResponse> getIncomingDelegations() {
        User assistant = getCurrentAssistant();
        return delegationLogRepository
                .findIncomingByAssistantIdAndStatus(
                        assistant.getUserId(),
                        DelegationStatus.PENDING.name())
                .stream()
                .map(delegationMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DelegationResponse> getDelegationHistory() {
        User currentUser = getCurrentHistoryUser();
        String roleName = currentUser.getRole() != null ? currentUser.getRole().getRoleName() : null;

        List<DelegationLog> history;
        if (RoleType.ACADEMICIAN.name().equals(roleName)) {
            history = delegationLogRepository.findHistoryByDelegatedByUserId(currentUser.getUserId());
        } else {
            history = delegationLogRepository.findHistoryByDelegatedToUserId(currentUser.getUserId());
        }

        return history.stream().map(delegationMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DelegationResponse getDelegation(Integer delegationId) {
        requireValidDelegationId(delegationId);
        User academician = getCurrentAcademician();
        DelegationLog delegationLog = delegationLogRepository.findByIdWithDetails(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.DELEGATION_NOT_FOUND));

        if (delegationLog.getDelegatedByUser() == null
                || !Objects.equals(delegationLog.getDelegatedByUser().getUserId(), academician.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.ACCESS_DENIED);
        }

        return delegationMapper.toResponse(delegationLog);
    }

    @Transactional
    public DelegationResponse acceptDelegation(Integer delegationId) {
        User assistant = getCurrentAssistant();
        DelegationLog delegationLog = getOwnedPendingDelegationForDecision(delegationId, assistant);

        Appointment appointment = delegationLog.getAppointment();
        if (appointment == null) {
            throw new ResourceNotFoundException(DelegationMessages.APPOINTMENT_NOT_FOUND);
        }
        validateAppointmentProcessable(appointment.getAppointmentStatus());

        LocalDateTime now = LocalDateTime.now();
        delegationLog.setDelegationStatus(DelegationStatus.ACCEPTED.name());
        delegationLog.setUpdatedAt(now);
        appointment.setStaff(assistant);
        appointment.setUpdatedAt(now);

        rejectOtherPendingDelegations(appointment.getAppointmentId(), delegationLog.getDelegationId(), now);

        delegationLogRepository.save(delegationLog);
        appointmentRepository.save(appointment);

        return delegationMapper.toResponse(
                delegationLogRepository.findByIdWithDetails(delegationLog.getDelegationId())
                        .orElse(delegationLog));
    }

    @Transactional
    public DelegationResponse rejectDelegation(Integer delegationId) {
        User assistant = getCurrentAssistant();
        DelegationLog delegationLog = getOwnedPendingDelegationForDecision(delegationId, assistant);

        Appointment appointment = delegationLog.getAppointment();
        if (appointment == null) {
            throw new ResourceNotFoundException(DelegationMessages.APPOINTMENT_NOT_FOUND);
        }
        validateAppointmentProcessable(appointment.getAppointmentStatus());

        LocalDateTime now = LocalDateTime.now();
        delegationLog.setDelegationStatus(DelegationStatus.REJECTED.name());
        delegationLog.setUpdatedAt(now);
        DelegationLog saved = delegationLogRepository.save(delegationLog);

        return delegationMapper.toResponse(
                delegationLogRepository.findByIdWithDetails(saved.getDelegationId())
                        .orElse(saved));
    }

    private DelegationLog getOwnedPendingDelegationForDecision(Integer delegationId, User assistant) {
        requireValidDelegationId(delegationId);

        // Pessimistic lock prevents concurrent accept/reject on the same PENDING row.
        DelegationLog delegationLog = delegationLogRepository.findByIdForUpdate(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.DELEGATION_NOT_FOUND));

        if (delegationLog.getDelegatedToUser() == null
                || !Objects.equals(delegationLog.getDelegatedToUser().getUserId(), assistant.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.DECISION_ACCESS_DENIED);
        }

        if (!DelegationStatus.PENDING.name().equals(delegationLog.getDelegationStatus())) {
            throw new ConflictException(DelegationMessages.NOT_PENDING);
        }

        return delegationLog;
    }

    private void requireValidDelegationId(Integer delegationId) {
        if (delegationId == null || delegationId <= 0) {
            throw new BadRequestException(DelegationMessages.INVALID_DELEGATION_ID);
        }
    }

    private void rejectOtherPendingDelegations(
            Integer appointmentId,
            Integer acceptedDelegationId,
            LocalDateTime updatedAt) {
        List<DelegationLog> otherPending =
                delegationLogRepository.findByAppointment_AppointmentIdAndDelegationStatusAndDelegationIdNot(
                        appointmentId,
                        DelegationStatus.PENDING.name(),
                        acceptedDelegationId);
        if (otherPending.isEmpty()) {
            return;
        }
        for (DelegationLog other : otherPending) {
            other.setDelegationStatus(DelegationStatus.REJECTED.name());
            other.setUpdatedAt(updatedAt);
        }
        delegationLogRepository.saveAll(otherPending);
    }

    private void validateAppointmentProcessable(String appointmentStatus) {
        if (TERMINAL_APPOINTMENT_STATUSES.contains(appointmentStatus)) {
            throw new ConflictException(DelegationMessages.APPOINTMENT_NOT_PROCESSABLE);
        }
    }

    private void validateAppointmentStatus(String appointmentStatus) {
        if (AppointmentStatus.APPROVED.name().equals(appointmentStatus)) {
            throw new BadRequestException(DelegationMessages.APPROVED_NOT_ALLOWED);
        }
        if (TERMINAL_APPOINTMENT_STATUSES.contains(appointmentStatus)) {
            throw new BadRequestException(DelegationMessages.TERMINAL_STATUS_NOT_ALLOWED);
        }
    }

    private User getCurrentAcademician() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        User user = userDetails.getUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!RoleType.ACADEMICIAN.name().equals(roleName)) {
            throw new AccessDeniedException(DelegationMessages.ONLY_ACADEMICIAN);
        }
        return user;
    }

    private User getCurrentAssistant() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        User user = userDetails.getUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!RoleType.ASSISTANT.name().equals(roleName)) {
            throw new AccessDeniedException(DelegationMessages.ONLY_ASSISTANT);
        }
        return user;
    }

    private User getCurrentHistoryUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        User user = userDetails.getUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!RoleType.ACADEMICIAN.name().equals(roleName)
                && !RoleType.ASSISTANT.name().equals(roleName)) {
            throw new AccessDeniedException(DelegationMessages.HISTORY_ACCESS_DENIED);
        }
        return user;
    }
}
