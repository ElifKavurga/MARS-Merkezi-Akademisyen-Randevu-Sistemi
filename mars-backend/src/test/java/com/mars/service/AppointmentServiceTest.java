package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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

import com.mars.AppointmentMessages;
import com.mars.dto.AppointmentCreateRequest;
import com.mars.dto.AppointmentResponseDto;
import com.mars.entity.Appointment;
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
import com.mars.mapper.AppointmentMapper;
import com.mars.repository.AppointmentCategoryRepository;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.CourseRepository;
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
    private AvailabilitySlotRepository availabilitySlotRepository;
    @Mock
    private AppointmentCategoryRepository appointmentCategoryRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private StudentPenaltyStatusRepository studentPenaltyStatusRepository;
    @Mock
    private AppointmentMapper appointmentMapper;

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
        student.setRole(studentRole);

        staff = new User();
        staff.setUserId(10);
        staff.setFullName("Dr. Test");

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
        category.setRequiresCourseSelection(false);

        baseRequest = new AppointmentCreateRequest(5, 3, null, null, false);

        CustomUserDetails userDetails = new CustomUserDetails(student);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, List.of()));
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
        when(availabilitySlotRepository.findByIdWithStaff(5)).thenReturn(Optional.of(slot));
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
        when(availabilitySlotRepository.findByIdWithStaff(5)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> appointmentService.createAppointment(baseRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessage(AppointmentMessages.SLOT_BLOCKED);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void createAppointment_takenSlot_throwsConflict() {
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaff(5)).thenReturn(Optional.of(slot));
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
        when(availabilitySlotRepository.findByIdWithStaff(5)).thenReturn(Optional.of(slot));

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
        verify(availabilitySlotRepository, never()).findByIdWithStaff(any());
    }

    @Test
    void createAppointment_overlappingTime_throwsConflict() {
        when(studentPenaltyStatusRepository.findById(20)).thenReturn(Optional.empty());
        when(availabilitySlotRepository.findByIdWithStaff(5)).thenReturn(Optional.of(slot));
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
        when(availabilitySlotRepository.findByIdWithStaff(5)).thenReturn(Optional.of(slot));
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
        when(availabilitySlotRepository.findByIdWithStaff(5)).thenReturn(Optional.of(slot));
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
        when(availabilitySlotRepository.findByIdWithStaff(5)).thenReturn(Optional.of(slot));
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
        when(availabilitySlotRepository.findByIdWithStaff(5)).thenReturn(Optional.of(slot));
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
}
