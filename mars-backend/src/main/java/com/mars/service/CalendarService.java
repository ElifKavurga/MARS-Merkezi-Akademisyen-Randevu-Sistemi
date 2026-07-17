package com.mars.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.CalendarMessages;
import com.mars.dto.CalendarEventResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.RecurrenceRule;
import com.mars.entity.User;
import com.mars.enums.RepeatType;
import com.mars.exception.BadRequestException;
import com.mars.mapper.CalendarMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final CalendarMapper calendarMapper;

    @Transactional(readOnly = true)
    public List<CalendarEventResponseDto> getEvents(LocalDate from, LocalDate to) {
        return getEvents(from, to, false);
    }

    @Transactional(readOnly = true)
    public List<CalendarEventResponseDto> getEvents(
            LocalDate from,
            LocalDate to,
            boolean includeAppointments) {
        validateRange(from, to);

        User currentUser = getCurrentUser();
        List<AvailabilitySlot> slots = availabilitySlotRepository.findCalendarSlotsForStaffInRange(
                currentUser.getUserId(), from, to);

        List<CalendarEventResponseDto> events = new ArrayList<>();
        for (AvailabilitySlot slot : slots) {
            events.addAll(expandSlotOccurrences(slot, from, to));
        }
        if (includeAppointments) {
            List<Appointment> appointments =
                    appointmentRepository.findCalendarAppointmentsForStaffInRange(
                            currentUser.getUserId(), from, to);
            appointments.stream()
                    .map(calendarMapper::toEvent)
                    .forEach(events::add);
        }

        events.sort(Comparator
                .comparing(CalendarEventResponseDto::getSlotDate)
                .thenComparing(CalendarEventResponseDto::getStartTime));
        return events;
    }

    private List<CalendarEventResponseDto> expandSlotOccurrences(
            AvailabilitySlot slot, LocalDate from, LocalDate to) {
        RecurrenceRule rule = slot.getRecurrenceRule();
        if (rule == null) {
            if (!slot.getSlotDate().isBefore(from) && !slot.getSlotDate().isAfter(to)) {
                return List.of(calendarMapper.toEvent(slot, slot.getSlotDate()));
            }
            return List.of();
        }

        if (!RepeatType.WEEKLY.name().equalsIgnoreCase(rule.getRepeatType())) {
            return List.of();
        }

        LocalDate rangeStart = rule.getStartDate().isAfter(from) ? rule.getStartDate() : from;
        LocalDate rangeEnd = rule.getEndDate().isBefore(to) ? rule.getEndDate() : to;
        if (rangeStart.isAfter(rangeEnd)) {
            return List.of();
        }

        DayOfWeek weekday = slot.getSlotDate().getDayOfWeek();
        List<CalendarEventResponseDto> occurrences = new ArrayList<>();
        LocalDate occurrence = rangeStart.with(TemporalAdjusters.nextOrSame(weekday));
        while (!occurrence.isAfter(rangeEnd)) {
            occurrences.add(calendarMapper.toEvent(slot, occurrence));
            occurrence = occurrence.plusWeeks(1);
        }
        return occurrences;
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (from == null) {
            throw new BadRequestException(CalendarMessages.FROM_REQUIRED);
        }
        if (to == null) {
            throw new BadRequestException(CalendarMessages.TO_REQUIRED);
        }
        if (from.isAfter(to)) {
            throw new BadRequestException(CalendarMessages.INVALID_RANGE);
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return userDetails.getUser();
    }
}
