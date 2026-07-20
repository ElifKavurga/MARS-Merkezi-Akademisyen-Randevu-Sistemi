package com.mars.mapper;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.stereotype.Component;

import com.mars.dto.AvailabilitySlotBlockRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.dto.AvailabilitySlotStatsResponseDto;
import com.mars.dto.AvailabilitySlotUpdateRequest;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.enums.MeetingType;

@Component
public class AvailabilitySlotMapper {

    public AvailabilitySlot toEntity(
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            User staff,
            String meetingType) {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setStaff(staff);
        slot.setSlotDate(slotDate);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
        slot.setRecurrenceRule(null);
        slot.setIsBlocked(false);
        slot.setMeetingType(meetingType);
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
                .recurrenceRuleId(slot.getRecurrenceRule() != null
                        ? slot.getRecurrenceRule().getRecurrenceRuleId()
                        : null)
                .isBlocked(Boolean.TRUE.equals(slot.getIsBlocked()))
                .meetingType(slot.getMeetingType() != null
                        ? slot.getMeetingType()
                        : MeetingType.FACE_TO_FACE.name())
                .build();
    }

    public AvailableSlotResponseDto toAvailableResponse(AvailabilitySlot slot) {
        return toAvailableResponse(slot, slot.getSlotDate());
    }

    public AvailableSlotResponseDto toAvailableResponse(AvailabilitySlot slot, LocalDate occurrenceDate) {
        return toAvailableResponse(slot, occurrenceDate, slot.getStartTime(), slot.getEndTime());
    }

    public AvailableSlotResponseDto toAvailableResponse(
            AvailabilitySlot slot,
            LocalDate occurrenceDate,
            LocalTime windowStart,
            LocalTime windowEnd) {
        User staff = slot.getStaff();
        return AvailableSlotResponseDto.builder()
                .slotId(slot.getSlotId())
                .staffId(staff != null ? staff.getUserId() : null)
                .staffName(staff != null ? staff.getFullName() : null)
                .slotDate(occurrenceDate)
                .startTime(windowStart)
                .endTime(windowEnd)
                .meetingType(slot.getMeetingType() != null
                        ? slot.getMeetingType()
                        : MeetingType.FACE_TO_FACE.name())
                .build();
    }
}
