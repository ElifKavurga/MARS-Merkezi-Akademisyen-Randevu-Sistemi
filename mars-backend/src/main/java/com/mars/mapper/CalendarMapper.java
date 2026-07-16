package com.mars.mapper;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.mars.dto.CalendarEventResponseDto;
import com.mars.entity.AvailabilitySlot;

@Component
public class CalendarMapper {

    public CalendarEventResponseDto toEvent(AvailabilitySlot slot, LocalDate occurrenceDate) {
        return CalendarEventResponseDto.builder()
                .slotId(slot.getSlotId())
                .slotDate(occurrenceDate)
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .recurrenceRuleId(slot.getRecurrenceRule() != null
                        ? slot.getRecurrenceRule().getRecurrenceRuleId()
                        : null)
                .isBlocked(Boolean.TRUE.equals(slot.getIsBlocked()))
                .build();
    }
}
