package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.dto.AssistantCourseResponseDto;
import com.mars.dto.AssistantDashboardResponseDto;
import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.Course;
import com.mars.entity.CourseAssignment;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.enums.RoleType;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.mapper.AppointmentMapper;
import com.mars.mapper.AssistantCourseMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class AssistantCourseServiceTest {

    @Mock
    private CourseAssignmentRepository courseAssignmentRepository;

    @Mock
    private AssistantCourseMapper assistantCourseMapper;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AppointmentMapper appointmentMapper;

    @InjectMocks
    private AssistantCourseService assistantCourseService;

    private User assistant;

    @BeforeEach
    void setUp() {
        Role role = new Role();
        role.setRoleName(RoleType.ASSISTANT.name());

        assistant = new User();
        assistant.setUserId(20);
        assistant.setRole(role);

        setAuthenticatedUser(assistant);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAssignedCourses_multipleAssignments_returnsAllOwnCourses() {
        CourseAssignment first = new CourseAssignment();
        CourseAssignment second = new CourseAssignment();
        AssistantCourseResponseDto firstResponse = response(1, "BLM101");
        AssistantCourseResponseDto secondResponse = response(2, "BLM202");

        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20))
                .thenReturn(List.of(first, second));
        when(assistantCourseMapper.toResponse(first)).thenReturn(firstResponse);
        when(assistantCourseMapper.toResponse(second)).thenReturn(secondResponse);

        List<AssistantCourseResponseDto> result = assistantCourseService.getAssignedCourses();

        assertThat(result).containsExactly(firstResponse, secondResponse);
        verify(courseAssignmentRepository).findAssignedCoursesByAssistantId(20);
    }

    @Test
    void getAssignedCourses_noAssignments_returnsEmptyList() {
        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20)).thenReturn(List.of());

        assertThat(assistantCourseService.getAssignedCourses()).isEmpty();
        verify(courseAssignmentRepository).findAssignedCoursesByAssistantId(20);
    }

    @Test
    void getAssignedCourses_usesAuthenticatedAssistantId_notAnotherAssistant() {
        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20)).thenReturn(List.of());

        assistantCourseService.getAssignedCourses();

        verify(courseAssignmentRepository).findAssignedCoursesByAssistantId(20);
    }

    @Test
    void getAssignedCourses_nonAssistant_throwsAccessDenied() {
        Role role = new Role();
        role.setRoleName(RoleType.ACADEMICIAN.name());
        assistant.setRole(role);
        setAuthenticatedUser(assistant);

        assertThatThrownBy(() -> assistantCourseService.getAssignedCourses())
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getDashboardSummary_sameOwnerAcrossCourses_countsAcademicianOnce() {
        User owner = user(10);
        CourseAssignment first = assignment(1, owner);
        CourseAssignment second = assignment(2, owner);
        AssistantCourseResponseDto firstResponse = response(1, "BLM101");
        AssistantCourseResponseDto secondResponse = response(2, "BLM202");

        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20))
                .thenReturn(List.of(first, second));
        when(assistantCourseMapper.toResponse(first)).thenReturn(firstResponse);
        when(assistantCourseMapper.toResponse(second)).thenReturn(secondResponse);

        AssistantDashboardResponseDto result = assistantCourseService.getDashboardSummary();

        assertThat(result.getAssignedCourseCount()).isEqualTo(2);
        assertThat(result.getRelatedAcademicianCount()).isEqualTo(1);
        assertThat(result.getAssignedCoursesPreview()).containsExactly(firstResponse, secondResponse);
        verify(courseAssignmentRepository).findAssignedCoursesByAssistantId(20);
    }

    @Test
    void getDashboardSummary_multipleOwners_countsDistinctAcademicians() {
        CourseAssignment first = assignment(1, user(10));
        CourseAssignment second = assignment(2, user(11));

        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20))
                .thenReturn(List.of(first, second));
        when(assistantCourseMapper.toResponse(first)).thenReturn(response(1, "BLM101"));
        when(assistantCourseMapper.toResponse(second)).thenReturn(response(2, "BLM202"));

        AssistantDashboardResponseDto result = assistantCourseService.getDashboardSummary();

        assertThat(result.getAssignedCourseCount()).isEqualTo(2);
        assertThat(result.getRelatedAcademicianCount()).isEqualTo(2);
    }

    @Test
    void getDashboardSummary_duplicateCourse_countsAndPreviewsOnce() {
        User owner = user(10);
        CourseAssignment first = assignment(1, owner);
        CourseAssignment duplicate = assignment(1, owner);
        AssistantCourseResponseDto response = response(1, "BLM101");

        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20))
                .thenReturn(List.of(first, duplicate));
        when(assistantCourseMapper.toResponse(first)).thenReturn(response);

        AssistantDashboardResponseDto result = assistantCourseService.getDashboardSummary();

        assertThat(result.getAssignedCourseCount()).isEqualTo(1);
        assertThat(result.getAssignedCoursesPreview()).containsExactly(response);
    }

    @Test
    void getDashboardSummary_noAssignments_returnsZerosAndEmptyPreview() {
        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20)).thenReturn(List.of());

        AssistantDashboardResponseDto result = assistantCourseService.getDashboardSummary();

        assertThat(result.getAssignedCourseCount()).isZero();
        assertThat(result.getRelatedAcademicianCount()).isZero();
        assertThat(result.getAssignedCoursesPreview()).isEmpty();
    }

    @Test
    void getDashboardSummary_returnsOnlyOwnedAppointmentCountsAndPreviews() {
        Appointment pending = appointment(101, AppointmentStatus.PENDING);
        Appointment upcoming = appointment(102, AppointmentStatus.APPROVED);
        StaffAppointmentResponseDto pendingDto =
                StaffAppointmentResponseDto.builder().appointmentId(101).build();
        StaffAppointmentResponseDto upcomingDto =
                StaffAppointmentResponseDto.builder().appointmentId(102).build();

        when(courseAssignmentRepository.findAssignedCoursesByAssistantId(20))
                .thenReturn(List.of());
        when(appointmentRepository.countByStaff_UserIdAndAppointmentStatus(
                20, AppointmentStatus.PENDING.name())).thenReturn(2L);
        when(appointmentRepository.countUpcomingByStaffIdAndStatus(
                eq(20), eq(AppointmentStatus.APPROVED.name()), any(), any()))
                .thenReturn(1L);
        when(appointmentRepository.findRecentPendingDashboardPreview(
                eq(20), eq(AppointmentStatus.PENDING.name()), any(Pageable.class)))
                .thenReturn(List.of(pending));
        when(appointmentRepository.findUpcomingDashboardPreview(
                eq(20),
                eq(AppointmentStatus.APPROVED.name()),
                any(),
                any(),
                any(Pageable.class)))
                .thenReturn(List.of(upcoming));
        when(appointmentMapper.toStaffResponse(pending)).thenReturn(pendingDto);
        when(appointmentMapper.toStaffResponse(upcoming)).thenReturn(upcomingDto);

        AssistantDashboardResponseDto result = assistantCourseService.getDashboardSummary();

        assertThat(result.getPendingAppointmentCount()).isEqualTo(2);
        assertThat(result.getUpcomingAppointmentCount()).isEqualTo(1);
        assertThat(result.getPendingAppointments()).containsExactly(pendingDto);
        assertThat(result.getUpcomingAppointments()).containsExactly(upcomingDto);
        verify(appointmentRepository).countByStaff_UserIdAndAppointmentStatus(
                20, AppointmentStatus.PENDING.name());
    }

    private void setAuthenticatedUser(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, List.of()));
    }

    private AssistantCourseResponseDto response(Integer courseId, String courseCode) {
        return AssistantCourseResponseDto.builder()
                .courseId(courseId)
                .courseCode(courseCode)
                .courseName("Ders " + courseId)
                .academicTerm("2026-2027 Güz")
                .ownerAcademicianName("Dr. Akademisyen")
                .build();
    }

    private User user(Integer userId) {
        User user = new User();
        user.setUserId(userId);
        user.setFullName("Akademisyen " + userId);
        return user;
    }

    private CourseAssignment assignment(Integer courseId, User owner) {
        Course course = new Course();
        course.setCourseId(courseId);
        course.setOwnerAcademician(owner);

        CourseAssignment assignment = new CourseAssignment();
        assignment.setCourse(course);
        assignment.setAssistant(assistant);
        return assignment;
    }

    private Appointment appointment(Integer appointmentId, AppointmentStatus status) {
        User student = new User();
        student.setFullName("Öğrenci Test");

        AppointmentCategory category = new AppointmentCategory();
        category.setCategoryName("Akademik Danışmanlık");

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(10, 10));

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(appointmentId);
        appointment.setStudent(student);
        appointment.setStaff(assistant);
        appointment.setCategory(category);
        appointment.setSlot(slot);
        appointment.setAppointmentStatus(status.name());
        appointment.setMeetingType(MeetingType.FACE_TO_FACE.name());
        return appointment;
    }
}
