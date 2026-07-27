package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.WaitlistEntryResponseDto;
import com.mars.entity.WaitlistEntry;

import java.time.LocalDateTime;

@Component
public class WaitlistEntryMapper {

    public WaitlistEntryResponseDto toResponseDto(WaitlistEntry entry, long offerDurationMinutes) {
        if (entry == null) {
            return null;
        }

        LocalDateTime expiresAt = null;
        if (entry.getOfferedAt() != null) {
            expiresAt = entry.getOfferedAt().plusMinutes(offerDurationMinutes);
        }

        return WaitlistEntryResponseDto.builder()
            .waitlistEntryId(entry.getWaitlistEntryId())
            .studentId(entry.getStudent() != null ? entry.getStudent().getUserId() : null)
            .studentName(entry.getStudent() != null ? entry.getStudent().getDisplayName() : null)
            .staffId(entry.getStaff() != null ? entry.getStaff().getUserId() : null)
            .staffName(entry.getStaff() != null ? entry.getStaff().getDisplayName() : null)
            .categoryId(entry.getCategory() != null ? entry.getCategory().getCategoryId() : null)
            .categoryName(entry.getCategory() != null ? entry.getCategory().getCategoryName() : null)
            .courseId(entry.getCourse() != null ? entry.getCourse().getCourseId() : null)
            .courseCode(entry.getCourse() != null ? entry.getCourse().getCourseCode() : null)
            .courseName(entry.getCourse() != null ? entry.getCourse().getCourseName() : null)
            .requestedAt(entry.getRequestedAt())
            .waitlistStatus(entry.getWaitlistStatus())
            .slotId(entry.getSlot() != null ? entry.getSlot().getSlotId() : null)
            .offeredAt(entry.getOfferedAt())
            .expiresAt(expiresAt)
            .build();
    }
}
