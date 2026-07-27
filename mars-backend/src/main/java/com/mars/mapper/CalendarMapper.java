package com.mars.mapper;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.mars.dto.CalendarEventResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AvailabilitySlot;

@Component
public class CalendarMapper {

    public CalendarEventResponseDto toEvent(AvailabilitySlot slot, LocalDate occurrenceDate) {
        return CalendarEventResponseDto.builder()
                .eventType("AVAILABILITY")
                .slotId(slot.getSlotId())
                .slotDate(occurrenceDate)
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .recurrenceRuleId(slot.getRecurrenceRule() != null
                        ? slot.getRecurrenceRule().getRecurrenceRuleId()
                        : null)
                .isBlocked(Boolean.TRUE.equals(slot.getIsBlocked()))
                .meetingType(slot.getMeetingType())
                .build();
    }

    public CalendarEventResponseDto toEvent(Appointment appointment) {
        AvailabilitySlot slot = appointment.getSlot();
        return CalendarEventResponseDto.builder()
                .eventType("APPOINTMENT")
                .slotId(slot != null ? slot.getSlotId() : null)
                .appointmentId(appointment.getAppointmentId())
                .slotDate(slot != null ? slot.getSlotDate() : null)
                .startTime(slot != null ? slot.getStartTime() : null)
                .endTime(slot != null && appointment.getCategory() != null && appointment.getCategory().getDurationMinutes() != null ? slot.getStartTime().plusMinutes(appointment.getCategory().getDurationMinutes()) : (slot != null ? slot.getEndTime() : null))
                .recurrenceRuleId(null)
                .isBlocked(null)
                .meetingType(appointment.getMeetingType())
                .studentName(appointment.getStudent() != null
                        ? appointment.getStudent().getFullName()
                        : null)
                .categoryName(appointment.getCategory() != null
                        ? appointment.getCategory().getCategoryName()
                        : null)
                .courseCode(appointment.getCourse() != null
                        ? appointment.getCourse().getCourseCode()
                        : null)
                .courseName(appointment.getCourse() != null
                        ? appointment.getCourse().getCourseName()
                        : null)
                .appointmentStatus(appointment.getAppointmentStatus())
                .build();
    }
}
