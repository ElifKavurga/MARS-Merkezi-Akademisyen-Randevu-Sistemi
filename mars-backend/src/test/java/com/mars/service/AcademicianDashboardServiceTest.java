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

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.dto.AcademicianDashboardResponseDto;
import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.enums.RoleType;
import com.mars.mapper.AppointmentMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.CourseRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class AcademicianDashboardServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private AppointmentMapper appointmentMapper;

    @InjectMocks
    private AcademicianDashboardService academicianDashboardService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getDashboardSummary_returnsOnlyAuthenticatedAcademicianData() {
        authenticate(RoleType.ACADEMICIAN, 10);
        Appointment pending = appointment(
                1, AppointmentStatus.PENDING, LocalDate.now().plusDays(2), LocalTime.of(10, 0));
        Appointment upcoming = appointment(
                2, AppointmentStatus.APPROVED, LocalDate.now().plusDays(1), LocalTime.of(9, 0));
        StaffAppointmentResponseDto pendingDto =
                StaffAppointmentResponseDto.builder().appointmentId(1).build();
        StaffAppointmentResponseDto upcomingDto =
                StaffAppointmentResponseDto.builder().appointmentId(2).build();

        when(appointmentRepository.countByStaff_UserIdAndAppointmentStatus(
                10, AppointmentStatus.PENDING.name())).thenReturn(4L);
        when(appointmentRepository.countUpcomingByStaffIdAndStatus(
                eq(10), eq(AppointmentStatus.APPROVED.name()), any(), any()))
                .thenReturn(2L);
        when(courseRepository.countByOwnerAcademician_UserIdAndIsActiveTrue(10))
                .thenReturn(3L);
        when(appointmentRepository.findPendingDashboardPreview(
                eq(10), eq(AppointmentStatus.PENDING.name()), any(), any(), any(Pageable.class)))
                .thenReturn(List.of(pending));
        when(appointmentRepository.findUpcomingDashboardPreview(
                eq(10), eq(AppointmentStatus.APPROVED.name()), any(), any(), any(Pageable.class)))
                .thenReturn(List.of(upcoming));
        when(appointmentMapper.toStaffResponse(pending)).thenReturn(pendingDto);
        when(appointmentMapper.toStaffResponse(upcoming)).thenReturn(upcomingDto);

        AcademicianDashboardResponseDto result =
                academicianDashboardService.getDashboardSummary();

        assertThat(result.getPendingAppointmentCount()).isEqualTo(4);
        assertThat(result.getUpcomingAppointmentCount()).isEqualTo(2);
        assertThat(result.getActiveCourseCount()).isEqualTo(3);
        assertThat(result.getPendingAppointments())
                .extracting(StaffAppointmentResponseDto::getAppointmentId)
                .containsExactly(1);
        assertThat(result.getUpcomingAppointments())
                .extracting(StaffAppointmentResponseDto::getAppointmentId)
                .containsExactly(2);
        verify(appointmentRepository).countByStaff_UserIdAndAppointmentStatus(
                10, AppointmentStatus.PENDING.name());
        verify(courseRepository).countByOwnerAcademician_UserIdAndIsActiveTrue(10);
    }

    @Test
    void getDashboardSummary_withoutData_returnsEmptySummary() {
        authenticate(RoleType.ACADEMICIAN, 10);
        when(appointmentRepository.findPendingDashboardPreview(
                eq(10), eq(AppointmentStatus.PENDING.name()), any(), any(), any(Pageable.class)))
                .thenReturn(List.of());
        when(appointmentRepository.findUpcomingDashboardPreview(
                eq(10), eq(AppointmentStatus.APPROVED.name()), any(), any(), any(Pageable.class)))
                .thenReturn(List.of());

        AcademicianDashboardResponseDto result =
                academicianDashboardService.getDashboardSummary();

        assertThat(result.getPendingAppointments()).isEmpty();
        assertThat(result.getUpcomingAppointments()).isEmpty();
    }

    @Test
    void getDashboardSummary_asAssistant_throwsAccessDeniedBeforeDataAccess() {
        authenticate(RoleType.ASSISTANT, 20);

        assertThatThrownBy(() -> academicianDashboardService.getDashboardSummary())
                .isInstanceOf(AccessDeniedException.class);

        verify(appointmentRepository, never())
                .countByStaff_UserIdAndAppointmentStatus(any(), any());
        verify(courseRepository, never())
                .countByOwnerAcademician_UserIdAndIsActiveTrue(any());
    }

    private void authenticate(RoleType roleType, Integer userId) {
        Role role = new Role();
        role.setRoleName(roleType.name());
        User user = new User();
        user.setUserId(userId);
        user.setRole(role);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new CustomUserDetails(user), null, List.of()));
    }

    private Appointment appointment(
            Integer id,
            AppointmentStatus status,
            LocalDate date,
            LocalTime startTime) {
        User student = new User();
        student.setFullName("Öğrenci Test");

        AppointmentCategory category = new AppointmentCategory();
        category.setCategoryName("Akademik Danışmanlık");

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotDate(date);
        slot.setStartTime(startTime);
        slot.setEndTime(startTime.plusMinutes(10));

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(id);
        appointment.setStudent(student);
        appointment.setCategory(category);
        appointment.setSlot(slot);
        appointment.setAppointmentStatus(status.name());
        appointment.setMeetingType(MeetingType.FACE_TO_FACE.name());
        return appointment;
    }
}
