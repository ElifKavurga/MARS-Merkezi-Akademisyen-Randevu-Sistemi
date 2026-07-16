package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.AvailabilitySlotBlockRequest;
import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.dto.AvailabilitySlotStatsResponseDto;
import com.mars.dto.AvailabilitySlotUpdateRequest;
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

    public void updateEntity(AvailabilitySlot slot, AvailabilitySlotUpdateRequest request) {
        slot.setSlotDate(request.getSlotDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
    }

    public void applyBlockStatus(AvailabilitySlot slot, AvailabilitySlotBlockRequest request) {
        slot.setIsBlocked(request.getIsBlocked());
    }

    public AvailabilitySlotStatsResponseDto toStatsResponse(
            long totalSlotCount,
            long availableSlotCount,
            long blockedSlotCount,
            long thisWeekSlotCount) {
        return AvailabilitySlotStatsResponseDto.builder()
                .totalSlotCount(totalSlotCount)
                .availableSlotCount(availableSlotCount)
                .blockedSlotCount(blockedSlotCount)
                .thisWeekSlotCount(thisWeekSlotCount)
                .build();
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
