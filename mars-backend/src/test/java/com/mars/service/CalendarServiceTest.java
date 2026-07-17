package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.CalendarMessages;
import com.mars.dto.CalendarEventResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.RecurrenceRule;
import com.mars.entity.User;
import com.mars.enums.RepeatType;
import com.mars.exception.BadRequestException;
import com.mars.mapper.CalendarMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class CalendarServiceTest {

    @Mock
    private AvailabilitySlotRepository availabilitySlotRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private CalendarMapper calendarMapper;

    @InjectMocks
    private CalendarService calendarService;

    private User academician;

    @BeforeEach
    void setUp() {
        academician = new User();
        academician.setUserId(10);

        CustomUserDetails userDetails = new CustomUserDetails(academician);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getEvents_listsOneTimeSlotsInRange() {
        LocalDate from = LocalDate.of(2026, 7, 13);
        LocalDate to = LocalDate.of(2026, 7, 19);

        AvailabilitySlot slot = oneTimeSlot(1, LocalDate.of(2026, 7, 14), false);
        CalendarEventResponseDto mapped = CalendarEventResponseDto.builder()
                .slotId(1)
                .slotDate(LocalDate.of(2026, 7, 14))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .isBlocked(false)
                .build();

        when(availabilitySlotRepository.findCalendarSlotsForStaffInRange(eq(10), eq(from), eq(to)))
                .thenReturn(List.of(slot));
        when(calendarMapper.toEvent(slot, LocalDate.of(2026, 7, 14))).thenReturn(mapped);

        List<CalendarEventResponseDto> events = calendarService.getEvents(from, to);

        assertThat(events).containsExactly(mapped);
        verify(availabilitySlotRepository).findCalendarSlotsForStaffInRange(10, from, to);
    }

    @Test
    void getEvents_expandsWeeklyRecurringSlots() {
        LocalDate from = LocalDate.of(2026, 7, 13);
        LocalDate to = LocalDate.of(2026, 7, 27);

        AvailabilitySlot slot = recurringSlot(
                2,
                LocalDate.of(2026, 7, 14),
                LocalDate.of(2026, 7, 14),
                LocalDate.of(2026, 7, 28),
                false);

        CalendarEventResponseDto week1 = CalendarEventResponseDto.builder()
                .slotId(2)
                .slotDate(LocalDate.of(2026, 7, 14))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 0))
                .recurrenceRuleId(5)
                .isBlocked(false)
                .build();
        CalendarEventResponseDto week2 = CalendarEventResponseDto.builder()
                .slotId(2)
                .slotDate(LocalDate.of(2026, 7, 21))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 0))
                .recurrenceRuleId(5)
                .isBlocked(false)
                .build();

        when(availabilitySlotRepository.findCalendarSlotsForStaffInRange(eq(10), eq(from), eq(to)))
                .thenReturn(List.of(slot));
        when(calendarMapper.toEvent(slot, LocalDate.of(2026, 7, 14))).thenReturn(week1);
        when(calendarMapper.toEvent(slot, LocalDate.of(2026, 7, 21))).thenReturn(week2);

        List<CalendarEventResponseDto> events = calendarService.getEvents(from, to);

        assertThat(events).containsExactly(week1, week2);
    }

    @Test
    void getEvents_showsBlockedSlots() {
        LocalDate from = LocalDate.of(2026, 7, 13);
        LocalDate to = LocalDate.of(2026, 7, 19);

        AvailabilitySlot slot = oneTimeSlot(3, LocalDate.of(2026, 7, 16), true);
        slot.setMeetingType("BOTH");
        CalendarEventResponseDto mapped =
                new CalendarMapper().toEvent(slot, LocalDate.of(2026, 7, 16));

        when(availabilitySlotRepository.findCalendarSlotsForStaffInRange(eq(10), eq(from), eq(to)))
                .thenReturn(List.of(slot));
        when(calendarMapper.toEvent(slot, LocalDate.of(2026, 7, 16))).thenReturn(mapped);

        List<CalendarEventResponseDto> events = calendarService.getEvents(from, to);

        assertThat(events).hasSize(1);
        assertThat(events.get(0).getIsBlocked()).isTrue();
        assertThat(events.get(0).getEventType()).isEqualTo("AVAILABILITY");
        assertThat(events.get(0).getMeetingType()).isEqualTo("BOTH");
    }

    @Test
    void getEvents_withAppointments_returnsOnlyAuthenticatedStaffCalendarData() {
        LocalDate from = LocalDate.of(2026, 7, 13);
        LocalDate to = LocalDate.of(2026, 7, 19);
        Appointment appointment = appointment(
                11, LocalDate.of(2026, 7, 16), "PENDING", "ONLINE");
        Appointment approvedAppointment = appointment(
                12, LocalDate.of(2026, 7, 17), "APPROVED", "FACE_TO_FACE");
        CalendarEventResponseDto mapped = new CalendarMapper().toEvent(appointment);
        CalendarEventResponseDto approvedMapped =
                new CalendarMapper().toEvent(approvedAppointment);

        when(availabilitySlotRepository.findCalendarSlotsForStaffInRange(10, from, to))
                .thenReturn(List.of());
        when(appointmentRepository.findCalendarAppointmentsForStaffInRange(10, from, to))
                .thenReturn(List.of(appointment, approvedAppointment));
        when(calendarMapper.toEvent(appointment)).thenReturn(mapped);
        when(calendarMapper.toEvent(approvedAppointment)).thenReturn(approvedMapped);

        List<CalendarEventResponseDto> events =
                calendarService.getEvents(from, to, true);

        assertThat(events).containsExactly(mapped, approvedMapped);
        assertThat(events.get(0).getCourseName()).isNull();
        assertThat(events.get(0).getMeetingType()).isEqualTo("ONLINE");
        verify(appointmentRepository).findCalendarAppointmentsForStaffInRange(10, from, to);
    }

    @Test
    void getEvents_filtersByDateRange() {
        LocalDate from = LocalDate.of(2026, 7, 20);
        LocalDate to = LocalDate.of(2026, 7, 26);

        AvailabilitySlot outsideRange = oneTimeSlot(1, LocalDate.of(2026, 7, 14), false);
        AvailabilitySlot recurring = recurringSlot(
                2,
                LocalDate.of(2026, 7, 14),
                LocalDate.of(2026, 7, 14),
                LocalDate.of(2026, 8, 1),
                false);

        CalendarEventResponseDto inRange = CalendarEventResponseDto.builder()
                .slotId(2)
                .slotDate(LocalDate.of(2026, 7, 21))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 0))
                .recurrenceRuleId(5)
                .isBlocked(false)
                .build();

        when(availabilitySlotRepository.findCalendarSlotsForStaffInRange(eq(10), eq(from), eq(to)))
                .thenReturn(List.of(outsideRange, recurring));
        when(calendarMapper.toEvent(recurring, LocalDate.of(2026, 7, 21))).thenReturn(inRange);

        List<CalendarEventResponseDto> events = calendarService.getEvents(from, to);

        assertThat(events).containsExactly(inRange);
    }

    @Test
    void getEvents_invalidRange_throwsBadRequest() {
        assertThatThrownBy(() -> calendarService.getEvents(
                        LocalDate.of(2026, 7, 20), LocalDate.of(2026, 7, 13)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(CalendarMessages.INVALID_RANGE);
    }

    @Test
    void getEvents_withoutAuthentication_throwsAccessDenied() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> calendarService.getEvents(
                        LocalDate.of(2026, 7, 13), LocalDate.of(2026, 7, 19)))
                .isInstanceOf(AccessDeniedException.class);
    }

    private AvailabilitySlot oneTimeSlot(Integer slotId, LocalDate date, boolean blocked) {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotId(slotId);
        slot.setStaff(academician);
        slot.setSlotDate(date);
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(12, 0));
        slot.setIsBlocked(blocked);
        slot.setRecurrenceRule(null);
        return slot;
    }

    private AvailabilitySlot recurringSlot(
            Integer slotId,
            LocalDate slotDate,
            LocalDate ruleStart,
            LocalDate ruleEnd,
            boolean blocked) {
        RecurrenceRule rule = new RecurrenceRule();
        rule.setRecurrenceRuleId(5);
        rule.setStaff(academician);
        rule.setRepeatType(RepeatType.WEEKLY.name());
        rule.setRepeatCount(4);
        rule.setStartDate(ruleStart);
        rule.setEndDate(ruleEnd);

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotId(slotId);
        slot.setStaff(academician);
        slot.setSlotDate(slotDate);
        slot.setStartTime(LocalTime.of(14, 0));
        slot.setEndTime(LocalTime.of(15, 0));
        slot.setIsBlocked(blocked);
        slot.setRecurrenceRule(rule);
        return slot;
    }

    private Appointment appointment(
            Integer appointmentId,
            LocalDate date,
            String status,
            String meetingType) {
        User student = new User();
        student.setUserId(20);
        student.setFullName("Öğrenci Test");

        AppointmentCategory category = new AppointmentCategory();
        category.setCategoryId(3);
        category.setCategoryName("Danışmanlık");

        AvailabilitySlot appointmentSlot = oneTimeSlot(appointmentId, date, false);
        appointmentSlot.setEndTime(LocalTime.of(10, 10));

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(appointmentId);
        appointment.setStudent(student);
        appointment.setStaff(academician);
        appointment.setCategory(category);
        appointment.setCourse(null);
        appointment.setSlot(appointmentSlot);
        appointment.setAppointmentStatus(status);
        appointment.setMeetingType(meetingType);
        return appointment;
    }
}
