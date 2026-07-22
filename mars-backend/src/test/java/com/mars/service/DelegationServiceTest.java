package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.DelegationMessages;
import com.mars.dto.CreateDelegationRequest;
import com.mars.dto.DelegationResponse;
import com.mars.entity.Appointment;
import com.mars.entity.Course;
import com.mars.entity.DelegationLog;
import com.mars.entity.Role;
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

@ExtendWith(MockitoExtension.class)
class DelegationServiceTest {

    @Mock
    private DelegationLogRepository delegationLogRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private CourseAssignmentRepository courseAssignmentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DelegationMapper delegationMapper;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private DelegationService delegationService;

    private User academician;
    private User assistant;
    private User otherAssistant;
    private Role academicianRole;
    private Role assistantRole;
    private Appointment appointment;
    private Course course;

    @BeforeEach
    void setUp() {
        academicianRole = role(1, RoleType.ACADEMICIAN.name());
        assistantRole = role(2, RoleType.ASSISTANT.name());

        academician = user(10, "Akademisyen", academicianRole);
        assistant = user(20, "Asistan", assistantRole);
        otherAssistant = user(21, "Diğer Asistan", assistantRole);

        course = new Course();
        course.setCourseId(5);
        course.setCourseCode("CSE101");
        course.setCourseName("Algoritmalar");

        appointment = new Appointment();
        appointment.setAppointmentId(100);
        appointment.setStaff(academician);
        appointment.setCourse(course);
        appointment.setAppointmentStatus(AppointmentStatus.PENDING.name());
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createDelegation_deniesWhenAppointmentOwnedBySomeoneElse() {
        authenticate(academician);
        Appointment foreign = new Appointment();
        foreign.setAppointmentId(101);
        foreign.setStaff(otherAssistant);
        foreign.setCourse(course);
        foreign.setAppointmentStatus(AppointmentStatus.PENDING.name());

        when(appointmentRepository.findByIdForUpdate(101)).thenReturn(Optional.of(foreign));

        CreateDelegationRequest request = new CreateDelegationRequest(101, 20);

        assertThatThrownBy(() -> delegationService.createDelegation(request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(DelegationMessages.OWNERSHIP_DENIED);
        verify(delegationLogRepository, never()).save(any());
    }

    @Test
    void createDelegation_rejectsSecondPendingForSameAppointment() {
        authenticate(academician);
        when(appointmentRepository.findByIdForUpdate(100)).thenReturn(Optional.of(appointment));
        when(userRepository.findByIdWithRoleAndDepartment(20)).thenReturn(Optional.of(assistant));
        when(courseAssignmentRepository.existsByCourse_CourseIdAndAssistant_UserId(5, 20)).thenReturn(true);
        when(delegationLogRepository.existsByAppointment_AppointmentIdAndDelegationStatus(
                100, DelegationStatus.PENDING.name())).thenReturn(true);

        CreateDelegationRequest request = new CreateDelegationRequest(100, 20);

        assertThatThrownBy(() -> delegationService.createDelegation(request))
                .isInstanceOf(ConflictException.class)
                .hasMessage(DelegationMessages.PENDING_EXISTS);
        verify(delegationLogRepository, never()).save(any());
    }

    @Test
    void createDelegation_rejectsProcessedAppointmentBeforeCreatingRequest() {
        authenticate(academician);
        appointment.setAppointmentStatus(AppointmentStatus.REJECTED.name());
        when(appointmentRepository.findByIdForUpdate(100)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> delegationService.createDelegation(
                new CreateDelegationRequest(100, 20)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(DelegationMessages.APPOINTMENT_NOT_PROCESSABLE);
        verify(delegationLogRepository, never()).save(any());
    }

    @Test
    void getDelegation_deniesAccessForOtherAcademician() {
        authenticate(academician);
        User otherAcademician = user(11, "Diğer Akademisyen", academicianRole);
        DelegationLog log = pendingDelegation(1, otherAcademician, assistant);

        when(delegationLogRepository.findByIdWithDetails(1)).thenReturn(Optional.of(log));

        assertThatThrownBy(() -> delegationService.getDelegation(1))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(DelegationMessages.ACCESS_DENIED);
    }

    @Test
    void getIncomingDelegations_requiresAssistantRole() {
        authenticate(academician);

        assertThatThrownBy(() -> delegationService.getIncomingDelegations())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(DelegationMessages.ONLY_ASSISTANT);
    }

    @Test
    void acceptDelegation_deniesWhenTargetIsDifferentAssistant() {
        authenticate(assistant);
        DelegationLog log = pendingDelegation(1, academician, otherAssistant);
        when(delegationLogRepository.findByIdForUpdate(1)).thenReturn(Optional.of(log));

        assertThatThrownBy(() -> delegationService.acceptDelegation(1))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(DelegationMessages.DECISION_ACCESS_DENIED);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void acceptDelegation_rejectsNonPendingStatus() {
        authenticate(assistant);
        DelegationLog log = pendingDelegation(1, academician, assistant);
        log.setDelegationStatus(DelegationStatus.ACCEPTED.name());
        when(delegationLogRepository.findByIdForUpdate(1)).thenReturn(Optional.of(log));

        assertThatThrownBy(() -> delegationService.acceptDelegation(1))
                .isInstanceOf(ConflictException.class)
                .hasMessage(DelegationMessages.NOT_PENDING);
    }

    @Test
    void acceptDelegation_notFoundForMissingId() {
        authenticate(assistant);
        when(delegationLogRepository.findByIdForUpdate(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> delegationService.acceptDelegation(999))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(DelegationMessages.DELEGATION_NOT_FOUND);
    }

    @Test
    void acceptDelegation_rejectsInvalidId() {
        authenticate(assistant);

        assertThatThrownBy(() -> delegationService.acceptDelegation(0))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(DelegationMessages.INVALID_DELEGATION_ID);
        verify(delegationLogRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void acceptDelegation_transfersOwnershipWhenPending() {
        authenticate(assistant);
        DelegationLog log = pendingDelegation(1, academician, assistant);
        DelegationResponse response = DelegationResponse.builder()
                .delegationId(1)
                .delegationStatus(DelegationStatus.ACCEPTED.name())
                .build();

        when(delegationLogRepository.findByIdForUpdate(1)).thenReturn(Optional.of(log));
        when(appointmentRepository.findByIdForUpdate(100)).thenReturn(Optional.of(appointment));
        when(delegationLogRepository.findByAppointment_AppointmentIdAndDelegationStatusAndDelegationIdNot(
                eq(100), eq(DelegationStatus.PENDING.name()), eq(1))).thenReturn(List.of());
        when(delegationLogRepository.save(log)).thenReturn(log);
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(delegationLogRepository.findByIdWithDetails(1)).thenReturn(Optional.of(log));
        when(delegationMapper.toResponse(log)).thenReturn(response);

        DelegationResponse result = delegationService.acceptDelegation(1);

        assertThat(result.getDelegationStatus()).isEqualTo(DelegationStatus.ACCEPTED.name());
        assertThat(log.getDelegationStatus()).isEqualTo(DelegationStatus.ACCEPTED.name());
        assertThat(appointment.getStaff()).isEqualTo(assistant);
        verify(appointmentRepository).save(appointment);
    }

    @Test
    void acceptDelegation_rechecksAppointmentStatusUnderLock() {
        authenticate(assistant);
        DelegationLog log = pendingDelegation(1, academician, assistant);
        appointment.setAppointmentStatus(AppointmentStatus.APPROVED.name());
        when(delegationLogRepository.findByIdForUpdate(1)).thenReturn(Optional.of(log));
        when(appointmentRepository.findByIdForUpdate(100)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> delegationService.acceptDelegation(1))
                .isInstanceOf(ConflictException.class)
                .hasMessage(DelegationMessages.APPOINTMENT_NOT_PROCESSABLE);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void rejectDelegation_doesNotChangeAppointmentStaff() {
        authenticate(assistant);
        DelegationLog log = pendingDelegation(1, academician, assistant);
        DelegationResponse response = DelegationResponse.builder()
                .delegationId(1)
                .delegationStatus(DelegationStatus.REJECTED.name())
                .build();

        when(delegationLogRepository.findByIdForUpdate(1)).thenReturn(Optional.of(log));
        when(delegationLogRepository.save(log)).thenReturn(log);
        when(delegationLogRepository.findByIdWithDetails(1)).thenReturn(Optional.of(log));
        when(delegationMapper.toResponse(log)).thenReturn(response);

        DelegationResponse result = delegationService.rejectDelegation(1);

        assertThat(result.getDelegationStatus()).isEqualTo(DelegationStatus.REJECTED.name());
        assertThat(appointment.getStaff()).isEqualTo(academician);
        verify(appointmentRepository, never()).save(any());
    }

    private void authenticate(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private static Role role(int id, String name) {
        Role role = new Role();
        role.setRoleId(id);
        role.setRoleName(name);
        return role;
    }

    private static User user(int id, String fullName, Role role) {
        User user = new User();
        user.setUserId(id);
        user.setFullName(fullName);
        user.setRole(role);
        user.setIsActive(true);
        return user;
    }

    private DelegationLog pendingDelegation(int id, User by, User to) {
        DelegationLog log = new DelegationLog();
        log.setDelegationId(id);
        log.setAppointment(appointment);
        log.setDelegatedByUser(by);
        log.setDelegatedToUser(to);
        log.setDelegatedAt(LocalDateTime.now());
        log.setUpdatedAt(LocalDateTime.now());
        log.setDelegationStatus(DelegationStatus.PENDING.name());
        return log;
    }
}
