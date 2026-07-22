package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.CreateDelegationRequest;
import com.mars.dto.DelegationResponse;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.Course;
import com.mars.entity.DelegationLog;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.DelegationStatus;
import com.mars.enums.RoleType;
import com.mars.enums.SlotLockStatus;
import com.mars.mapper.DelegationMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AppointmentRescheduleRequestRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.repository.DelegationLogRepository;
import com.mars.repository.UserRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class DelegationStudentApprovalServiceTest {

    @Mock private DelegationLogRepository delegationLogRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private AppointmentRescheduleRequestRepository appointmentRescheduleRequestRepository;
    @Mock private AvailabilitySlotRepository availabilitySlotRepository;
    @Mock private CourseAssignmentRepository courseAssignmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private DelegationMapper delegationMapper;
    @Mock private AvailabilitySlotService availabilitySlotService;
    @Mock private NotificationService notificationService;
    @InjectMocks private DelegationService delegationService;

    private User academician;
    private User assistant;
    private User unrelatedAssistant;
    private User student;
    private Appointment appointment;
    private AvailabilitySlot targetSlot;

    @BeforeEach
    void setUp() {
        academician = user(10, "Akademisyen", RoleType.ACADEMICIAN);
        assistant = user(20, "Ders Asistanı", RoleType.ASSISTANT);
        unrelatedAssistant = user(21, "Diğer Asistan", RoleType.ASSISTANT);
        student = user(30, "Öğrenci", RoleType.STUDENT);

        Course course = new Course();
        course.setCourseId(5);
        AppointmentCategory category = new AppointmentCategory();
        category.setCategoryId(7);
        category.setDurationMinutes(30);
        LocalDate date = LocalDate.now().plusDays(2);

        appointment = new Appointment();
        appointment.setAppointmentId(100);
        appointment.setStaff(academician);
        appointment.setStudent(student);
        appointment.setCourse(course);
        appointment.setCategory(category);
        appointment.setAppointmentStatus(AppointmentStatus.PENDING.name());
        appointment.setSlot(slot(40, academician, date));
        targetSlot = slot(41, assistant, date);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void relatedCourseAssistantSkipsStudentApproval() {
        authenticate(academician);
        stubCreate(assistant, true);
        DelegationLog log = mappedLog(1, assistant);

        DelegationResponse result = delegationService.createDelegation(requestFor(assistant));

        assertThat(result.getDelegationStatus()).isEqualTo(DelegationStatus.PENDING.name());
        assertThat(log.getApprovalRequired()).isFalse();
        assertThat(log.getSlotLockStatus()).isNull();
        verify(notificationService, never()).createPreparedEmailNotification(any(), any(), any(), any(), any());
    }

    @Test
    void unrelatedAssistantRequiresStudentApprovalAndLocksSlot() {
        authenticate(academician);
        targetSlot.setStaff(unrelatedAssistant);
        stubCreate(unrelatedAssistant, false);
        DelegationLog log = mappedLog(2, unrelatedAssistant);

        DelegationResponse result = delegationService.createDelegation(requestFor(unrelatedAssistant));

        assertThat(result.getDelegationStatus()).isEqualTo(DelegationStatus.PENDING_STUDENT_APPROVAL.name());
        assertThat(log.getApprovalRequired()).isTrue();
        assertThat(log.getSlotLockStatus()).isEqualTo(SlotLockStatus.LOCKED.name());
        assertThat(log.getStudentApprovalExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(59));
        verify(notificationService).createPreparedEmailNotification(
                eq(student), eq("DELEGATION_STUDENT_APPROVAL"), any(), any(), eq(log));
    }

    @Test
    void studentRejectionKeepsOwnerAndReleasesSlot() {
        authenticate(student);
        DelegationLog log = studentApprovalLog(3, unrelatedAssistant);
        when(delegationLogRepository.findByIdForUpdate(3)).thenReturn(Optional.of(log));
        when(delegationLogRepository.save(log)).thenReturn(log);
        stubResponse(log);

        DelegationResponse result = delegationService.rejectStudentApproval(3);

        assertThat(result.getDelegationStatus()).isEqualTo(DelegationStatus.STUDENT_REJECTED.name());
        assertThat(log.getSlotLockStatus()).isEqualTo(SlotLockStatus.RELEASED.name());
        assertThat(appointment.getStaff()).isEqualTo(academician);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void studentAcceptanceTransfersAppointmentAndConsumesSlotLock() {
        authenticate(student);
        targetSlot.setStaff(unrelatedAssistant);
        DelegationLog log = studentApprovalLog(5, unrelatedAssistant);
        log.setTargetSlot(targetSlot);
        log.setTargetSlotDate(targetSlot.getSlotDate());
        log.setTargetStartTime(targetSlot.getStartTime());
        log.setTargetEndTime(targetSlot.getEndTime());
        when(delegationLogRepository.findByIdForUpdate(5)).thenReturn(Optional.of(log));
        when(appointmentRepository.findByIdForUpdate(100)).thenReturn(Optional.of(appointment));
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(41)).thenReturn(Optional.of(targetSlot));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(delegationLogRepository.save(log)).thenReturn(log);
        stubResponse(log);

        DelegationResponse result = delegationService.acceptStudentApproval(5);

        assertThat(result.getDelegationStatus()).isEqualTo(DelegationStatus.ACCEPTED.name());
        assertThat(log.getSlotLockStatus()).isEqualTo(SlotLockStatus.CONSUMED.name());
        assertThat(appointment.getStaff()).isEqualTo(unrelatedAssistant);
        assertThat(appointment.getSlot()).isEqualTo(targetSlot);
        verify(appointmentRepository).save(appointment);
        verify(notificationService).createPreparedEmailNotification(
                eq(academician), eq("DELEGATION_STUDENT_ACCEPTED"), any(), any(), eq(log));
    }

    @Test
    void timeoutReleasesSlotAndNotifiesAcademician() {
        DelegationLog log = studentApprovalLog(4, unrelatedAssistant);
        log.setStudentApprovalExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(delegationLogRepository.findExpiredStudentApprovals(
                eq(DelegationStatus.PENDING_STUDENT_APPROVAL.name()), any())).thenReturn(List.of(log));

        delegationService.expireStudentApprovals();

        assertThat(log.getDelegationStatus()).isEqualTo(DelegationStatus.EXPIRED.name());
        assertThat(log.getSlotLockStatus()).isEqualTo(SlotLockStatus.RELEASED.name());
        verify(delegationLogRepository).saveAll(List.of(log));
        verify(notificationService).createPreparedEmailNotification(
                eq(academician), eq("DELEGATION_EXPIRED"), any(), any(), eq(log));
    }

    private void stubCreate(User target, boolean relatedAssistant) {
        when(appointmentRepository.findByIdForUpdate(100)).thenReturn(Optional.of(appointment));
        when(userRepository.findByIdWithRoleAndDepartment(target.getUserId())).thenReturn(Optional.of(target));
        when(courseAssignmentRepository.existsByCourse_CourseIdAndAssistant_UserId(5, target.getUserId()))
                .thenReturn(relatedAssistant);
        when(availabilitySlotService.getBookableAvailableSlotsForStaff(target.getUserId(), 30))
                .thenReturn(List.of(availableSlot()));
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(41)).thenReturn(Optional.of(targetSlot));
    }

    private DelegationLog mappedLog(int id, User target) {
        DelegationLog log = new DelegationLog();
        log.setDelegationId(id);
        log.setAppointment(appointment);
        log.setDelegatedByUser(academician);
        log.setDelegatedToUser(target);
        log.setDelegationStatus(DelegationStatus.PENDING.name());
        when(delegationMapper.toEntity(eq(appointment), eq(academician), eq(target), any())).thenReturn(log);
        when(delegationLogRepository.save(log)).thenReturn(log);
        stubResponse(log);
        return log;
    }

    private DelegationLog studentApprovalLog(int id, User target) {
        DelegationLog log = new DelegationLog();
        log.setDelegationId(id);
        log.setAppointment(appointment);
        log.setDelegatedByUser(academician);
        log.setDelegatedToUser(target);
        log.setDelegationStatus(DelegationStatus.PENDING_STUDENT_APPROVAL.name());
        log.setStudentApprovalExpiresAt(LocalDateTime.now().plusMinutes(30));
        log.setSlotLockStatus(SlotLockStatus.LOCKED.name());
        return log;
    }

    private void stubResponse(DelegationLog log) {
        when(delegationLogRepository.findByIdWithDetails(log.getDelegationId())).thenReturn(Optional.of(log));
        when(delegationMapper.toResponse(log)).thenAnswer(invocation -> DelegationResponse.builder()
                .delegationId(log.getDelegationId())
                .delegationStatus(log.getDelegationStatus())
                .approvalRequired(log.getApprovalRequired())
                .slotLockStatus(log.getSlotLockStatus())
                .build());
    }

    private CreateDelegationRequest requestFor(User target) {
        CreateDelegationRequest request = new CreateDelegationRequest();
        request.setAppointmentId(100);
        request.setTargetUserId(target.getUserId());
        request.setTargetSlotId(41);
        request.setTargetSlotDate(targetSlot.getSlotDate());
        request.setTargetStartTime(targetSlot.getStartTime());
        request.setTargetEndTime(targetSlot.getEndTime());
        return request;
    }

    private AvailableSlotResponseDto availableSlot() {
        return AvailableSlotResponseDto.builder()
                .slotId(41)
                .staffId(targetSlot.getStaff().getUserId())
                .slotDate(targetSlot.getSlotDate())
                .startTime(targetSlot.getStartTime())
                .endTime(targetSlot.getEndTime())
                .build();
    }

    private static AvailabilitySlot slot(int id, User staff, LocalDate date) {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotId(id);
        slot.setStaff(staff);
        slot.setSlotDate(date);
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(10, 30));
        slot.setIsBlocked(false);
        slot.setMeetingType("FACE_TO_FACE");
        return slot;
    }

    private static User user(int id, String name, RoleType roleType) {
        Role role = new Role();
        role.setRoleId(id);
        role.setRoleName(roleType.name());
        User user = new User();
        user.setUserId(id);
        user.setFullName(name);
        user.setRole(role);
        user.setIsActive(true);
        return user;
    }

    private static void authenticate(User user) {
        CustomUserDetails details = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, List.of()));
    }
}
