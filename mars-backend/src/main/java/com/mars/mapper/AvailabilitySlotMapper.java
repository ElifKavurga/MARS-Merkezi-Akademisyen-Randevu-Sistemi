package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.entity.AvailabilitySlot;

@Component
public class AvailabilitySlotMapper {

    public AvailabilitySlotResponseDto toResponse(AvailabilitySlot slot) {
        return AvailabilitySlotResponseDto.builder()
                .slotId(slot.getSlotId())
                .slotDate(slot.getSlotDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .isBlocked(Boolean.TRUE.equals(slot.getIsBlocked()))
                .build();
    }
}
