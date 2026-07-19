package com.mars.service;

import java.time.LocalDateTime;
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
        return delegationMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DelegationResponse getDelegation(Integer delegationId) {
        User academician = getCurrentAcademician();
        DelegationLog delegationLog = delegationLogRepository.findByIdWithDetails(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.DELEGATION_NOT_FOUND));

        if (delegationLog.getDelegatedByUser() == null
                || !Objects.equals(delegationLog.getDelegatedByUser().getUserId(), academician.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.ACCESS_DENIED);
        }

        return delegationMapper.toResponse(delegationLog);
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
}
