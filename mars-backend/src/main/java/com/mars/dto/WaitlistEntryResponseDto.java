package com.mars.dto;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record WaitlistEntryResponseDto(
    Integer waitlistEntryId,
    Integer studentId,
    String studentName,
    Integer staffId,
    String staffName,
    Integer categoryId,
    String categoryName,
    Integer courseId,
    String courseCode,
    String courseName,
    LocalDateTime requestedAt,
    String waitlistStatus,
    Integer slotId,
    LocalDateTime offeredAt,
    LocalDateTime expiresAt
) {}
