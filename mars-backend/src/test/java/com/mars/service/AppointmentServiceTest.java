package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.AppointmentMessages;
import com.mars.dto.AppointmentCreateRequest;
import com.mars.dto.AppointmentRescheduleRequest;
import com.mars.dto.AppointmentRescheduleResponse;
import com.mars.dto.AppointmentResponseDto;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.dto.StudentAppointmentResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentRescheduleApproval;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.Role;
import com.mars.entity.StudentPenaltyStatus;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.AppointmentMapper;
import com.mars.repository.AppointmentCategoryRepository;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AppointmentRescheduleRequestRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.CourseRepository;
import com.mars.repository.DelegationLogRepository;
import com.mars.repository.OutOfOfficePeriodRepository;
import com.mars.repository.StudentPenaltyStatusRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    private static final Set<String> ACTIVE_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name());

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private AppointmentRescheduleRequestRepository appointmentRescheduleRequestRepository;
    @Mock
    private AvailabilitySlotRepository availabilitySlotRepository;
    @Mock
    private AppointmentCategoryRepository appointmentCategoryRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private StudentPenaltyStatusRepository studentPenaltyStatusRepository;
    @Mock
    private OutOfOfficePeriodRepository outOfOfficePeriodRepository;
    @Mock
    private AppointmentMapper appointmentMapper;
    @Mock
    private AvailabilitySlotService availabilitySlotService;
    @Mock
    private DelegationLogRepository delegationLogRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AppointmentService appointmentService;

    private User student;
    private User staff;
    private AvailabilitySlot slot;
    private AppointmentCategory category;
    private AppointmentCreateRequest baseRequest;

    @BeforeEach
    void setUp() {
        Role studentRole = new Role();
        studentRole.setRoleName(RoleType.STUDENT.name());

        student = new User();
        student.setUserId(20);
        student.setFullName("Öğrenci Test");
        student.setRole(studentRole);

        staff = new User();
        staff.setUserId(10);
        staff.setFullName("Dr. Test");
        Role staffRole = new Role();
        staffRole.setRoleName(RoleType.ACADEMICIAN.name());
        staff.setRole(staffRole);
        staff.setIsActive(true);
        staff.setIsAcceptingAppointments(true);

        slot = new AvailabilitySlot();
        slot.setSlotId(5);
        slot.setStaff(staff);
        slot.setSlotDate(LocalDate.now().plusDays(2));
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(10, 10));
        slot.setIsBlocked(false);
        slot.setMeetingType(MeetingType.FACE_TO_FACE.name());

        category = new AppointmentCategory();
        category.setCategoryId(3);
        category.setCategoryName("Akademik Danışmanlık");
        category.setDurationMinutes(10);
        category.setRequiresCourseSelection(false);

        baseRequest = new AppointmentCreateRequest(5, 3, null, null, false);

        CustomUserDetails userDetails = new CustomUserDetails(student);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, List.of()));

        lenient().when(outOfOfficePeriodRepository.existsOverlappingPeriod(any(), any(), any()))
                .thenReturn(false);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createAppointment_successfulRequest_returnsPending() {
        Appointment appointment = new Appointment();
        appointment.setAppointmentId(100);
        AppointmentResponseDto response = AppointmentResponseDto.builder()
                .appointmentId(100)
                .appointmentStatus(AppointmentStatus.PENDING.name())
                .meetingType(MeetingType.FACE_TO_FACE.name())
                .build();

        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(5, ACTIVE_STATUSES))
                .thenReturn(false);
        when(appointmentRepository.existsOverlappingActiveAppointmentForStudent(
                eq(20), eq(slot.getSlotDate()), eq(slot.getStartTime()), eq(slot.getEndTime()), eq(ACTIVE_STATUSES)))
                .thenReturn(false);
        when(appointmentCategoryRepository.findById(3)).thenReturn(Optional.of(category));
        when(appointmentMapper.toEntity(baseRequest, student, slot, category, null, MeetingType.FACE_TO_FACE.name()))
                .thenReturn(appointment);
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toResponse(appointment)).thenReturn(response);

        AppointmentResponseDto result = appointmentService.createAppointment(baseRequest);

        assertThat(result.getAppointmentId()).isEqualTo(100);
        assertThat(result.getAppointmentStatus()).isEqualTo(AppointmentStatus.PENDING.name());
        assertThat(result.getMeetingType()).isEqualTo(MeetingType.FACE_TO_FACE.name());
    }

    @Test
    void createAppointment_blockedSlot_throwsConflict() {
        slot.setIsBlocked(true);
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.SLOT_BLOCKED);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void createAppointment_takenSlot_throwsConflict() {
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(5, ACTIVE_STATUSES))
                .thenReturn(true);

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.SLOT_TAKEN);
    }

    @Test
    void createAppointment_pastSlot_throwsBadRequest() {
        slot.setSlotDate(LocalDate.now().minusDays(1));
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(AppointmentMessages.SLOT_PAST);
    }

    @Test
    void createAppointment_restrictedStudent_throwsConflict() {
        StudentPenaltyStatus penalty = new StudentPenaltyStatus();
        penalty.setIsRestricted(true);
        penalty.setRestrictionEndDate(LocalDate.now().plusDays(5));
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.of(penalty));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.STUDENT_RESTRICTED);
        verify(availabilitySlotRepository, never()).findByIdWithStaffForUpdate(any());
    }

    @Test
    void createAppointment_slotTooSoon_throwsBadRequest() {
        java.time.ZoneId zone = java.time.ZoneId.of("Europe/Istanbul");
        java.time.LocalDateTime now = java.time.LocalDateTime.now(zone);
        slot.setSlotDate(now.toLocalDate());
        slot.setStartTime(now.toLocalTime().plusMinutes(10).withSecond(0).withNano(0));
        slot.setEndTime(slot.getStartTime().plusMinutes(10));
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(AppointmentMessages.SLOT_TOO_SOON);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void createAppointment_slotBeyondHorizon_throwsBadRequest() {
        java.time.ZoneId zone = java.time.ZoneId.of("Europe/Istanbul");
        slot.setSlotDate(java.time.LocalDate.now(zone).plusDays(15));
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(AppointmentMessages.SLOT_TOO_FAR);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void createAppointment_outOfOffice_throwsConflict() {
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));
        when(outOfOfficePeriodRepository.existsOverlappingPeriod(
                        10, slot.getSlotDate(), slot.getSlotDate()))
                .thenReturn(true);

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.SLOT_OUT_OF_OFFICE);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void createAppointment_inactiveStaff_throwsConflict() {
        staff.setIsActive(false);
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.STAFF_INACTIVE);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void createAppointment_staffNotAccepting_throwsConflict() {
        staff.setIsAcceptingAppointments(false);
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.STAFF_NOT_ACCEPTING);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void createAppointment_nonBookableStaffRole_throwsBadRequest() {
        Role studentRole = new Role();
        studentRole.setRoleName(RoleType.STUDENT.name());
        staff.setRole(studentRole);
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(AppointmentMessages.STAFF_NOT_BOOKABLE);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void createAppointment_overlappingTime_throwsConflict() {
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(5, ACTIVE_STATUSES))
                .thenReturn(false);
        when(appointmentRepository.existsOverlappingActiveAppointmentForStudent(
                eq(20), eq(slot.getSlotDate()), eq(slot.getStartTime()), eq(slot.getEndTime()), eq(ACTIVE_STATUSES)))
                .thenReturn(true);

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.TIME_OVERLAP);
    }

    @Test
    void createAppointment_faceToFaceSlot_assignsFaceToFace() {
        slot.setMeetingType(MeetingType.FACE_TO_FACE.name());
        Appointment appointment = new Appointment();
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(5, ACTIVE_STATUSES))
                .thenReturn(false);
        when(appointmentRepository.existsOverlappingActiveAppointmentForStudent(
                any(), any(), any(), any(), any())).thenReturn(false);
        when(appointmentCategoryRepository.findById(3)).thenReturn(Optional.of(category));
        when(appointmentMapper.toEntity(baseRequest, student, slot, category, null, MeetingType.FACE_TO_FACE.name()))
                .thenReturn(appointment);
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toResponse(appointment)).thenReturn(
                AppointmentResponseDto.builder().meetingType(MeetingType.FACE_TO_FACE.name()).build());

        AppointmentResponseDto result = appointmentService.createAppointment(baseRequest);
        assertThat(result.getMeetingType()).isEqualTo(MeetingType.FACE_TO_FACE.name());
        verify(appointmentMapper).toEntity(baseRequest, student, slot, category, null, MeetingType.FACE_TO_FACE.name());
    }

    @Test
    void createAppointment_onlineSlot_assignsOnline() {
        slot.setMeetingType(MeetingType.ONLINE.name());
        Appointment appointment = new Appointment();
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(5, ACTIVE_STATUSES))
                .thenReturn(false);
        when(appointmentRepository.existsOverlappingActiveAppointmentForStudent(
                any(), any(), any(), any(), any())).thenReturn(false);
        when(appointmentCategoryRepository.findById(3)).thenReturn(Optional.of(category));
        when(appointmentMapper.toEntity(baseRequest, student, slot, category, null, MeetingType.ONLINE.name()))
                .thenReturn(appointment);
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toResponse(appointment)).thenReturn(
                AppointmentResponseDto.builder().meetingType(MeetingType.ONLINE.name()).build());

        AppointmentResponseDto result = appointmentService.createAppointment(baseRequest);
        assertThat(result.getMeetingType()).isEqualTo(MeetingType.ONLINE.name());
    }

    @Test
    void createAppointment_bothSlot_requiresStudentChoice() {
        slot.setMeetingType(MeetingType.BOTH.name());
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(5, ACTIVE_STATUSES))
                .thenReturn(false);
        when(appointmentRepository.existsOverlappingActiveAppointmentForStudent(
                any(), any(), any(), any(), any())).thenReturn(false);
        when(appointmentCategoryRepository.findById(3)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(AppointmentMessages.MEETING_TYPE_REQUIRED);
    }

    @Test
    void createAppointment_bothSlot_withOnlineChoice_savesOnline() {
        slot.setMeetingType(MeetingType.BOTH.name());
        baseRequest.setMeetingType(MeetingType.ONLINE.name());
        Appointment appointment = new Appointment();
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(5)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(5, ACTIVE_STATUSES))
                .thenReturn(false);
        when(appointmentRepository.existsOverlappingActiveAppointmentForStudent(
                any(), any(), any(), any(), any())).thenReturn(false);
        when(appointmentCategoryRepository.findById(3)).thenReturn(Optional.of(category));
        when(appointmentMapper.toEntity(baseRequest, student, slot, category, null, MeetingType.ONLINE.name()))
                .thenReturn(appointment);
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toResponse(appointment)).thenReturn(
                AppointmentResponseDto.builder().meetingType(MeetingType.ONLINE.name()).build());

        AppointmentResponseDto result = appointmentService.createAppointment(baseRequest);
        assertThat(result.getMeetingType()).isEqualTo(MeetingType.ONLINE.name());
        verify(appointmentMapper).toEntity(baseRequest, student, slot, category, null, MeetingType.ONLINE.name());
    }

    @Test
    void createAppointment_nonStudent_throwsAccessDenied() {
        Role academicianRole = new Role();
        academicianRole.setRoleName(RoleType.ACADEMICIAN.name());
        student.setRole(academicianRole);

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(AppointmentMessages.ONLY_STUDENT);
    }

    @Test
    void getAssistantAppointments_pendingFilter_returnsOnlyOwnedPendingAppointments() {
        authenticateAsAssistant();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.PENDING.name());
        StaffAppointmentResponseDto response = StaffAppointmentResponseDto.builder()
                .appointmentId(100)
                .studentName("Öğrenci Test")
                .appointmentDate(slot.getSlotDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .categoryName("Akademik Danışmanlık")
                .meetingType(MeetingType.FACE_TO_FACE.name())
                .appointmentStatus(AppointmentStatus.PENDING.name())
                .build();

        when(appointmentRepository.findAllByStaffIdWithDetails(
                10, AppointmentStatus.PENDING.name())).thenReturn(List.of(appointment));
        when(appointmentMapper.toStaffResponse(appointment)).thenReturn(response);

        List<StaffAppointmentResponseDto> result =
                appointmentService.getStaffAppointments("pending", RoleType.ASSISTANT);

        assertThat(result).singleElement()
                .extracting(StaffAppointmentResponseDto::getAppointmentId)
                .isEqualTo(100);
        verify(appointmentRepository).findAllByStaffIdWithDetails(
                10, AppointmentStatus.PENDING.name());
    }

    @Test
    void getAssistantAppointments_withoutStatus_returnsAllOwnedAppointments() {
        authenticateAsAssistant();
        Appointment pending = assistantAppointment(100, AppointmentStatus.PENDING.name());
        Appointment approved = assistantAppointment(101, AppointmentStatus.APPROVED.name());
        approved.getSlot().setSlotDate(LocalDate.now().plusDays(1));

        when(appointmentRepository.findAllByStaffIdWithDetails(10, null))
                .thenReturn(List.of(pending, approved));
        when(appointmentMapper.toStaffResponse(pending)).thenReturn(
                StaffAppointmentResponseDto.builder().appointmentId(100).build());
        when(appointmentMapper.toStaffResponse(approved)).thenReturn(
                StaffAppointmentResponseDto.builder().appointmentId(101).build());

        List<StaffAppointmentResponseDto> result =
                appointmentService.getStaffAppointments(null, RoleType.ASSISTANT);

        assertThat(result).extracting(StaffAppointmentResponseDto::getAppointmentId)
                .containsExactly(101, 100);
    }

    @Test
    void getAssistantAppointment_ownedAppointment_returnsDetailWithNullCourse() {
        authenticateAsAssistant();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.PENDING.name());
        appointment.setCourse(null);
        appointment.setMeetingType(MeetingType.ONLINE.name());
        StaffAppointmentResponseDto response =
                new AppointmentMapper().toStaffResponse(appointment);

        when(appointmentRepository.findByIdAndStaffIdWithDetails(100, 10))
                .thenReturn(Optional.of(appointment));
        when(appointmentMapper.toStaffResponse(appointment)).thenReturn(response);

        StaffAppointmentResponseDto result =
                appointmentService.getStaffAppointment(100, RoleType.ASSISTANT);

        assertThat(result.getAppointmentId()).isEqualTo(100);
        assertThat(result.getCourseName()).isNull();
        assertThat(result.getMeetingType()).isEqualTo(MeetingType.ONLINE.name());
    }

    @Test
    void getAssistantAppointment_otherStaffAppointment_throwsNotFound() {
        authenticateAsAssistant();
        when(appointmentRepository.findByIdAndStaffIdWithDetails(999, 10))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                appointmentService.getStaffAppointment(999, RoleType.ASSISTANT))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(AppointmentMessages.APPOINTMENT_NOT_FOUND);
    }

    @Test
    void getAssistantAppointments_invalidStatus_throwsBadRequest() {
        authenticateAsAssistant();

        assertThatThrownBy(() ->
                appointmentService.getStaffAppointments("BOTH", RoleType.ASSISTANT))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(AppointmentMessages.INVALID_STATUS);

        verify(appointmentRepository, never()).findAllByStaffIdWithDetails(any(), any());
    }

    @Test
    void getAssistantAppointments_nonAssistant_throwsAccessDenied() {
        assertThatThrownBy(() ->
                appointmentService.getStaffAppointments(null, RoleType.ASSISTANT))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(AppointmentMessages.ONLY_ASSISTANT);
    }

    @Test
    void approveAssistantAppointment_ownedPending_updatesStatusAndPreservesFaceToFace() {
        authenticateAsAssistant();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.PENDING.name());
        appointment.setMeetingType(MeetingType.FACE_TO_FACE.name());
        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toStaffResponse(appointment))
                .thenAnswer(invocation -> new AppointmentMapper().toStaffResponse(appointment));

        StaffAppointmentResponseDto result =
                appointmentService.approveStaffAppointment(100, RoleType.ASSISTANT);

        assertThat(result.getAppointmentStatus()).isEqualTo(AppointmentStatus.APPROVED.name());
        assertThat(result.getMeetingType()).isEqualTo(MeetingType.FACE_TO_FACE.name());
        assertThat(appointment.getUpdatedAt()).isNotNull();
        verify(appointmentRepository).save(appointment);
    }

    @Test
    void approveAssistantAppointment_online_preservesOnlineMeetingType() {
        authenticateAsAssistant();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.PENDING.name());
        appointment.setMeetingType(MeetingType.ONLINE.name());
        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toStaffResponse(appointment))
                .thenAnswer(invocation -> new AppointmentMapper().toStaffResponse(appointment));

        StaffAppointmentResponseDto result =
                appointmentService.approveStaffAppointment(100, RoleType.ASSISTANT);

        assertThat(result.getAppointmentStatus()).isEqualTo(AppointmentStatus.APPROVED.name());
        assertThat(result.getMeetingType()).isEqualTo(MeetingType.ONLINE.name());
    }

    @Test
    void rejectAssistantAppointment_ownedPending_updatesStatus() {
        authenticateAsAssistant();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.PENDING.name());
        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toStaffResponse(appointment))
                .thenAnswer(invocation -> new AppointmentMapper().toStaffResponse(appointment));

        StaffAppointmentResponseDto result =
                appointmentService.rejectStaffAppointment(100, RoleType.ASSISTANT);

        assertThat(result.getAppointmentStatus()).isEqualTo(AppointmentStatus.REJECTED.name());
        assertThat(appointment.getMeetingType()).isEqualTo(MeetingType.FACE_TO_FACE.name());
    }

    @ParameterizedTest
    @EnumSource(
            value = AppointmentStatus.class,
            names = {"APPROVED", "REJECTED", "COMPLETED", "NO_SHOW"})
    void approveAssistantAppointment_nonPendingStatus_throwsConflict(AppointmentStatus status) {
        authenticateAsAssistant();
        Appointment appointment = assistantAppointment(100, status.name());
        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));

        assertThatThrownBy(() ->
                appointmentService.approveStaffAppointment(100, RoleType.ASSISTANT))
                .isInstanceOf(ConflictException.class);

        verify(appointmentRepository, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(
            value = AppointmentStatus.class,
            names = {"APPROVED", "REJECTED", "COMPLETED", "NO_SHOW"})
    void rejectAssistantAppointment_nonPendingStatus_throwsConflict(AppointmentStatus status) {
        authenticateAsAssistant();
        Appointment appointment = assistantAppointment(100, status.name());
        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));

        assertThatThrownBy(() ->
                appointmentService.rejectStaffAppointment(100, RoleType.ASSISTANT))
                .isInstanceOf(ConflictException.class);

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void approveAssistantAppointment_otherStaffAppointment_throwsNotFound() {
        authenticateAsAssistant();
        when(appointmentRepository.findByIdAndStaffIdForUpdate(999, 10))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                appointmentService.approveStaffAppointment(999, RoleType.ASSISTANT))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(AppointmentMessages.APPOINTMENT_NOT_FOUND);
    }

    @Test
    void rejectAssistantAppointment_otherStaffAppointment_throwsNotFound() {
        authenticateAsAssistant();
        when(appointmentRepository.findByIdAndStaffIdForUpdate(999, 10))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                appointmentService.rejectStaffAppointment(999, RoleType.ASSISTANT))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(AppointmentMessages.APPOINTMENT_NOT_FOUND);
    }

    @Test
    void approveAssistantAppointment_secondRequest_isRejected() {
        authenticateAsAssistant();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.PENDING.name());
        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toStaffResponse(appointment))
                .thenAnswer(invocation -> new AppointmentMapper().toStaffResponse(appointment));

        appointmentService.approveStaffAppointment(100, RoleType.ASSISTANT);

        assertThatThrownBy(() ->
                appointmentService.approveStaffAppointment(100, RoleType.ASSISTANT))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.ALREADY_APPROVED);
        verify(appointmentRepository).save(appointment);
    }

    @Test
    void getStaffAppointments_asAcademician_returnsOnlyOwnedPendingAppointments() {
        authenticateAsAcademician();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.PENDING.name());
        StaffAppointmentResponseDto response =
                new AppointmentMapper().toStaffResponse(appointment);

        when(appointmentRepository.findAllByStaffIdWithDetails(
                10, AppointmentStatus.PENDING.name()))
                .thenReturn(List.of(appointment));
        when(appointmentMapper.toStaffResponse(appointment)).thenReturn(response);

        List<StaffAppointmentResponseDto> result =
                appointmentService.getStaffAppointments("PENDING", RoleType.ACADEMICIAN);

        assertThat(result).singleElement()
                .extracting(StaffAppointmentResponseDto::getAppointmentId)
                .isEqualTo(100);
        verify(appointmentRepository).findAllByStaffIdWithDetails(
                10, AppointmentStatus.PENDING.name());
    }

    @Test
    void getStaffAppointment_asAcademician_otherStaffAppointment_throwsNotFound() {
        authenticateAsAcademician();
        when(appointmentRepository.findByIdAndStaffIdWithDetails(999, 10))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                appointmentService.getStaffAppointment(999, RoleType.ACADEMICIAN))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(AppointmentMessages.APPOINTMENT_NOT_FOUND);
    }

    @Test
    void approveStaffAppointment_asAcademician_updatesPendingAndRejectsSecondRequest() {
        authenticateAsAcademician();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.PENDING.name());
        appointment.setMeetingType(MeetingType.ONLINE.name());
        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toStaffResponse(appointment))
                .thenAnswer(invocation -> new AppointmentMapper().toStaffResponse(appointment));

        StaffAppointmentResponseDto result =
                appointmentService.approveStaffAppointment(100, RoleType.ACADEMICIAN);

        assertThat(result.getAppointmentStatus()).isEqualTo(AppointmentStatus.APPROVED.name());
        assertThat(result.getMeetingType()).isEqualTo(MeetingType.ONLINE.name());
        assertThatThrownBy(() ->
                appointmentService.approveStaffAppointment(100, RoleType.ACADEMICIAN))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.ALREADY_APPROVED);
        verify(appointmentRepository).save(appointment);
    }

    @Test
    void rejectStaffAppointment_asAcademician_updatesPending() {
        authenticateAsAcademician();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.PENDING.name());
        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentMapper.toStaffResponse(appointment))
                .thenAnswer(invocation -> new AppointmentMapper().toStaffResponse(appointment));

        StaffAppointmentResponseDto result =
                appointmentService.rejectStaffAppointment(100, RoleType.ACADEMICIAN);

        assertThat(result.getAppointmentStatus()).isEqualTo(AppointmentStatus.REJECTED.name());
    }

    @Test
    void getStaffAppointmentRescheduleSlots_ownedAppointment_reusesAvailabilityCalculation() {
        authenticateAsAcademician();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.APPROVED.name());
        AvailableSlotResponseDto availableSlot = AvailableSlotResponseDto.builder()
                .slotId(6)
                .slotDate(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(13, 0))
                .endTime(LocalTime.of(13, 10))
                .isBooked(false)
                .build();
        when(appointmentRepository.findByIdAndStaffIdWithDetails(100, 10))
                .thenReturn(Optional.of(appointment));
        when(availabilitySlotService.getBookableAvailableSlotsForStaff(10, 10, true))
                .thenReturn(List.of(availableSlot));

        List<AvailableSlotResponseDto> result = appointmentService
                .getStaffAppointmentRescheduleSlots(100, RoleType.ACADEMICIAN);

        assertThat(result).containsExactly(availableSlot);
        verify(availabilitySlotService).getBookableAvailableSlotsForStaff(10, 10, true);
    }

    @Test
    void rescheduleStaffAppointment_ownedAvailableSlot_createsPendingApprovalWithoutChangingAppointment() {
        authenticateAsAcademician();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.APPROVED.name());
        LocalDate newDate = LocalDate.now().plusDays(3);
        AvailabilitySlot target = new AvailabilitySlot();
        target.setSlotId(6);
        target.setStaff(staff);
        target.setSlotDate(newDate);
        target.setStartTime(LocalTime.of(13, 0));
        target.setEndTime(LocalTime.of(13, 10));
        target.setMeetingType(MeetingType.ONLINE.name());
        target.setIsBlocked(false);
        AvailableSlotResponseDto availableSlot = AvailableSlotResponseDto.builder()
                .slotId(6)
                .slotDate(newDate)
                .startTime(LocalTime.of(13, 0))
                .endTime(LocalTime.of(13, 10))
                .meetingType(MeetingType.ONLINE.name())
                .isBooked(false)
                .build();
        AppointmentRescheduleRequest request = new AppointmentRescheduleRequest(
                6, newDate, LocalTime.of(13, 0), LocalTime.of(13, 10), MeetingType.ONLINE.name());

        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));
        when(availabilitySlotService.getBookableAvailableSlotsForStaff(10, 10, true))
                .thenReturn(List.of(availableSlot));
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(6))
                .thenReturn(Optional.of(target));
        AvailabilitySlot originalSlot = appointment.getSlot();
        when(appointmentRescheduleRequestRepository.save(any(AppointmentRescheduleApproval.class)))
                .thenAnswer(invocation -> {
                    AppointmentRescheduleApproval saved = invocation.getArgument(0);
                    saved.setRescheduleRequestId(31);
                    return saved;
                });

        AppointmentRescheduleResponse result = appointmentService.rescheduleStaffAppointment(
                100, request, RoleType.ACADEMICIAN);

        assertThat(result.getProposedDate()).isEqualTo(newDate);
        assertThat(result.getProposedStartTime()).isEqualTo(LocalTime.of(13, 0));
        assertThat(result.getStatus()).isEqualTo("PENDING");
        assertThat(appointment.getSlot()).isSameAs(originalSlot);
        verify(appointmentRepository, never()).save(appointment);
        verify(appointmentRescheduleRequestRepository).save(any(AppointmentRescheduleApproval.class));
    }

    @Test
    void rescheduleStaffAppointment_targetLockedByDelegation_throwsConflict() {
        authenticateAsAcademician();
        Appointment appointment = assistantAppointment(100, AppointmentStatus.APPROVED.name());
        LocalDate newDate = LocalDate.now().plusDays(3);
        AvailabilitySlot target = new AvailabilitySlot();
        target.setSlotId(6);
        target.setStaff(staff);
        target.setSlotDate(newDate);
        target.setStartTime(LocalTime.of(13, 0));
        target.setEndTime(LocalTime.of(13, 10));
        target.setMeetingType(MeetingType.ONLINE.name());
        target.setIsBlocked(false);
        AvailableSlotResponseDto availableSlot = AvailableSlotResponseDto.builder()
                .slotId(6)
                .slotDate(newDate)
                .startTime(LocalTime.of(13, 0))
                .endTime(LocalTime.of(13, 10))
                .meetingType(MeetingType.ONLINE.name())
                .isBooked(false)
                .build();
        AppointmentRescheduleRequest request = new AppointmentRescheduleRequest(
                6, newDate, LocalTime.of(13, 0), LocalTime.of(13, 10), MeetingType.ONLINE.name());

        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));
        when(availabilitySlotService.getBookableAvailableSlotsForStaff(10, 10, true))
                .thenReturn(List.of(availableSlot));
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(6))
                .thenReturn(Optional.of(target));
        when(delegationLogRepository.existsActiveSlotLock(
                eq(10), eq(newDate), eq(LocalTime.of(13, 0)), eq(LocalTime.of(13, 10)),
                any(LocalDateTime.class), eq(null)))
                .thenReturn(true);

        assertThatThrownBy(() -> appointmentService.rescheduleStaffAppointment(
                100, request, RoleType.ACADEMICIAN))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.SLOT_TAKEN);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void acceptStudentReschedule_movesAppointmentToNewSlotAndReleasesOriginalSlot() {
        Appointment appointment = studentOwnedAppointment(100, AppointmentStatus.APPROVED.name());
        AvailabilitySlot originalSlot = appointment.getSlot();
        AvailabilitySlot targetSlot = new AvailabilitySlot();
        targetSlot.setSlotId(6);
        targetSlot.setStaff(staff);
        targetSlot.setSlotDate(LocalDate.now().plusDays(3));
        targetSlot.setStartTime(LocalTime.of(13, 0));
        targetSlot.setEndTime(LocalTime.of(13, 10));
        targetSlot.setMeetingType(MeetingType.ONLINE.name());

        AppointmentRescheduleApproval approval = new AppointmentRescheduleApproval();
        approval.setRescheduleRequestId(31);
        approval.setAppointment(appointment);
        approval.setOriginalSlot(originalSlot);
        approval.setProposedSlot(targetSlot);
        approval.setProposedMeetingType(MeetingType.ONLINE.name());
        approval.setRequestStatus("PENDING");
        approval.setExpiresAt(LocalDateTime.now(ZoneId.of("Europe/Istanbul")).plusHours(1));

        when(appointmentRescheduleRequestRepository.findByIdForUpdate(31)).thenReturn(Optional.of(approval));
        when(appointmentRepository.findByIdAndStudentIdForUpdate(100, 20)).thenReturn(Optional.of(appointment));
        when(availabilitySlotRepository.findByIdWithStaffForUpdate(6)).thenReturn(Optional.of(targetSlot));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentRescheduleRequestRepository.save(approval)).thenReturn(approval);

        AppointmentRescheduleResponse result = appointmentService.acceptStudentReschedule(31);

        assertThat(result.getStatus()).isEqualTo("ACCEPTED");
        assertThat(appointment.getSlot()).isSameAs(targetSlot);
        assertThat(appointment.getSlot()).isNotSameAs(originalSlot);
        verify(appointmentRepository).save(appointment);
    }

    @Test
    void rejectStudentReschedule_cancelsAppointmentAndReleasesBothSlots() {
        Appointment appointment = studentOwnedAppointment(100, AppointmentStatus.APPROVED.name());
        AvailabilitySlot originalSlot = appointment.getSlot();
        AvailabilitySlot targetSlot = new AvailabilitySlot();
        targetSlot.setSlotId(6);
        targetSlot.setStaff(staff);
        targetSlot.setSlotDate(LocalDate.now().plusDays(3));
        targetSlot.setStartTime(LocalTime.of(13, 0));
        targetSlot.setEndTime(LocalTime.of(13, 10));

        AppointmentRescheduleApproval approval = new AppointmentRescheduleApproval();
        approval.setRescheduleRequestId(31);
        approval.setAppointment(appointment);
        approval.setOriginalSlot(originalSlot);
        approval.setProposedSlot(targetSlot);
        approval.setProposedMeetingType(MeetingType.FACE_TO_FACE.name());
        approval.setRequestStatus("PENDING");
        approval.setExpiresAt(LocalDateTime.now(ZoneId.of("Europe/Istanbul")).plusHours(1));

        when(appointmentRescheduleRequestRepository.findByIdForUpdate(31)).thenReturn(Optional.of(approval));
        when(appointmentRepository.findByIdAndStudentIdForUpdate(100, 20)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentRescheduleRequestRepository.save(approval)).thenReturn(approval);

        AppointmentRescheduleResponse result = appointmentService.rejectStudentReschedule(31);

        assertThat(result.getStatus()).isEqualTo("REJECTED");
        assertThat(appointment.getAppointmentStatus()).isEqualTo(AppointmentStatus.CANCELLED.name());
        assertThat(appointment.getSlot()).isSameAs(originalSlot);
        verify(appointmentRepository).save(appointment);
    }

    @ParameterizedTest
    @EnumSource(value = AppointmentStatus.class, names = {"COMPLETED", "CANCELLED", "NO_SHOW"})
    void rescheduleStaffAppointment_terminalStatus_throwsConflict(AppointmentStatus status) {
        authenticateAsAcademician();
        Appointment appointment = assistantAppointment(100, status.name());
        when(appointmentRepository.findByIdAndStaffIdForUpdate(100, 10))
                .thenReturn(Optional.of(appointment));
        AppointmentRescheduleRequest request = new AppointmentRescheduleRequest(
                6,
                LocalDate.now().plusDays(3),
                LocalTime.of(13, 0),
                LocalTime.of(13, 10),
                MeetingType.ONLINE.name());

        assertThatThrownBy(() -> appointmentService.rescheduleStaffAppointment(
                100, request, RoleType.ACADEMICIAN))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.RESCHEDULE_NOT_ALLOWED);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void getStaffAppointments_academicianEndpointRoleWithAssistantPrincipal_throwsAccessDenied() {
        authenticateAsAssistant();

        assertThatThrownBy(() ->
                appointmentService.getStaffAppointments(null, RoleType.ACADEMICIAN))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(AppointmentMessages.ONLY_ACADEMICIAN);
        verify(appointmentRepository, never()).findAllByStaffIdWithDetails(any(), any());
    }

    @Test
    void getStaffAppointments_unsupportedRequiredRole_throwsAccessDenied() {
        authenticateAsAcademician();

        assertThatThrownBy(() ->
                appointmentService.getStaffAppointments(null, RoleType.HOD))
                .isInstanceOf(AccessDeniedException.class);
        verify(appointmentRepository, never()).findAllByStaffIdWithDetails(any(), any());
    }

    @Test
    void getStudentAppointment_otherStudentsAppointment_throwsAccessDenied() {
        when(appointmentRepository.findByIdAndStudentIdWithDetails(999, 20))
                .thenReturn(Optional.empty());
        when(appointmentRepository.existsByAppointmentId(999)).thenReturn(true);

        assertThatThrownBy(() -> appointmentService.getStudentAppointment(999))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(AppointmentMessages.STUDENT_APPOINTMENT_ACCESS_DENIED);
    }

    @Test
    void getStudentAppointment_missing_throwsNotFound() {
        when(appointmentRepository.findByIdAndStudentIdWithDetails(404, 20))
                .thenReturn(Optional.empty());
        when(appointmentRepository.existsByAppointmentId(404)).thenReturn(false);

        assertThatThrownBy(() -> appointmentService.getStudentAppointment(404))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(AppointmentMessages.APPOINTMENT_NOT_FOUND);
    }

    @Test
    void cancelStudentAppointment_pendingFuture_setsCancelled() {
        Appointment appointment = studentOwnedAppointment(100, AppointmentStatus.PENDING.name());
        when(appointmentRepository.findByIdAndStudentIdForUpdate(100, 20))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentRepository.findByIdAndStudentIdWithDetails(100, 20))
                .thenReturn(Optional.of(appointment));
        when(appointmentMapper.toStudentResponse(appointment))
                .thenAnswer(invocation -> new AppointmentMapper().toStudentResponse(appointment));

        StudentAppointmentResponseDto result = appointmentService.cancelStudentAppointment(100);

        assertThat(result.getAppointmentStatus()).isEqualTo(AppointmentStatus.CANCELLED.name());
        assertThat(appointment.getAppointmentStatus()).isEqualTo(AppointmentStatus.CANCELLED.name());
        verify(appointmentRepository).save(appointment);
        ArgumentCaptor<com.mars.dto.NotificationCreateRequest> notificationCaptor =
                ArgumentCaptor.forClass(com.mars.dto.NotificationCreateRequest.class);
        verify(notificationService).createNotification(notificationCaptor.capture());
        assertThat(notificationCaptor.getValue().getUserId()).isEqualTo(staff.getUserId());
        assertThat(notificationCaptor.getValue().getNotificationType())
                .isEqualTo(com.mars.enums.NotificationType.APPOINTMENT_CANCELLED);
        assertThat(notificationCaptor.getValue().getRelatedAppointmentId()).isEqualTo(100);
        assertThat(notificationCaptor.getValue().getMessage())
                .contains(student.getFullName(), category.getCategoryName(), "randevusunu iptal etti");
    }

    @Test
    void cancelStudentAppointment_assistantOwned_notifiesCurrentAssistant() {
        User assistant = new User();
        assistant.setUserId(30);
        assistant.setFullName("Asistan Test");
        Role assistantRole = new Role();
        assistantRole.setRoleName(RoleType.ASSISTANT.name());
        assistant.setRole(assistantRole);
        Appointment appointment = studentOwnedAppointment(100, AppointmentStatus.APPROVED.name());
        appointment.setStaff(assistant);
        appointment.getSlot().setStaff(assistant);
        when(appointmentRepository.findByIdAndStudentIdForUpdate(100, 20))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        when(appointmentRepository.findByIdAndStudentIdWithDetails(100, 20))
                .thenReturn(Optional.of(appointment));
        when(appointmentMapper.toStudentResponse(appointment))
                .thenAnswer(invocation -> new AppointmentMapper().toStudentResponse(appointment));

        appointmentService.cancelStudentAppointment(100);

        ArgumentCaptor<com.mars.dto.NotificationCreateRequest> notificationCaptor =
                ArgumentCaptor.forClass(com.mars.dto.NotificationCreateRequest.class);
        verify(notificationService).createNotification(notificationCaptor.capture());
        assertThat(notificationCaptor.getValue().getUserId()).isEqualTo(assistant.getUserId());
        assertThat(notificationCaptor.getValue().getRelatedAppointmentId()).isEqualTo(100);
    }

    @Test
    void cancelStudentAppointment_alreadyCancelled_throwsConflict() {
        Appointment appointment = studentOwnedAppointment(100, AppointmentStatus.CANCELLED.name());
        when(appointmentRepository.findByIdAndStudentIdForUpdate(100, 20))
                .thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.cancelStudentAppointment(100))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.CANCEL_ALREADY_CANCELLED);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void cancelStudentAppointment_completed_throwsConflict() {
        Appointment appointment = studentOwnedAppointment(100, AppointmentStatus.COMPLETED.name());
        when(appointmentRepository.findByIdAndStudentIdForUpdate(100, 20))
                .thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.cancelStudentAppointment(100))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.CANCEL_NOT_ACTIVE);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void cancelStudentAppointment_noShow_throwsConflict() {
        Appointment appointment = studentOwnedAppointment(100, AppointmentStatus.NO_SHOW.name());
        when(appointmentRepository.findByIdAndStudentIdForUpdate(100, 20))
                .thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.cancelStudentAppointment(100))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.CANCEL_NOT_ACTIVE);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void cancelStudentAppointment_pastSlot_throwsBadRequest() {
        Appointment appointment = studentOwnedAppointment(100, AppointmentStatus.APPROVED.name());
        appointment.getSlot().setSlotDate(
                LocalDate.now(ZoneId.of("Europe/Istanbul")).minusDays(1));
        when(appointmentRepository.findByIdAndStudentIdForUpdate(100, 20))
                .thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.cancelStudentAppointment(100))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(AppointmentMessages.CANCEL_PAST);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void cancelStudentAppointment_otherStudentsAppointment_throwsAccessDenied() {
        when(appointmentRepository.findByIdAndStudentIdForUpdate(999, 20))
                .thenReturn(Optional.empty());
        when(appointmentRepository.existsByAppointmentId(999)).thenReturn(true);

        assertThatThrownBy(() -> appointmentService.cancelStudentAppointment(999))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(AppointmentMessages.CANCEL_ACCESS_DENIED);
        verify(appointmentRepository, never()).save(any());
    }

    private void authenticateAsAssistant() {
        Role assistantRole = new Role();
        assistantRole.setRoleName(RoleType.ASSISTANT.name());
        staff.setRole(assistantRole);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new CustomUserDetails(staff), null, List.of()));
    }

    private void authenticateAsAcademician() {
        Role academicianRole = new Role();
        academicianRole.setRoleName(RoleType.ACADEMICIAN.name());
        staff.setRole(academicianRole);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new CustomUserDetails(staff), null, List.of()));
    }

    private Appointment assistantAppointment(Integer appointmentId, String status) {
        AvailabilitySlot appointmentSlot = new AvailabilitySlot();
        appointmentSlot.setSlotId(appointmentId);
        appointmentSlot.setStaff(staff);
        appointmentSlot.setSlotDate(LocalDate.now().plusDays(2));
        appointmentSlot.setStartTime(LocalTime.of(10, 0));
        appointmentSlot.setEndTime(LocalTime.of(10, 10));

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(appointmentId);
        appointment.setStaff(staff);
        appointment.setStudent(student);
        appointment.setCategory(category);
        appointment.setSlot(appointmentSlot);
        appointment.setAppointmentStatus(status);
        appointment.setMeetingType(MeetingType.FACE_TO_FACE.name());
        return appointment;
    }

    private Appointment studentOwnedAppointment(Integer appointmentId, String status) {
        AvailabilitySlot appointmentSlot = new AvailabilitySlot();
        appointmentSlot.setSlotId(appointmentId);
        appointmentSlot.setStaff(staff);
        appointmentSlot.setSlotDate(LocalDate.now(ZoneId.of("Europe/Istanbul")).plusDays(2));
        appointmentSlot.setStartTime(LocalTime.of(10, 0));
        appointmentSlot.setEndTime(LocalTime.of(10, 10));

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(appointmentId);
        appointment.setStaff(staff);
        appointment.setStudent(student);
        appointment.setCategory(category);
        appointment.setSlot(appointmentSlot);
        appointment.setAppointmentStatus(status);
        appointment.setMeetingType(MeetingType.FACE_TO_FACE.name());
        return appointment;
    }
}
