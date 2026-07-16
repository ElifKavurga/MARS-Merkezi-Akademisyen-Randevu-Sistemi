package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;

@Component
public class AvailabilitySlotMapper {

    public AvailabilitySlot toEntity(AvailabilitySlotCreateRequest request, User staff) {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setStaff(staff);
        slot.setSlotDate(request.getSlotDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setRecurrenceRule(null);
        slot.setIsBlocked(false);
        return slot;
    }

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
