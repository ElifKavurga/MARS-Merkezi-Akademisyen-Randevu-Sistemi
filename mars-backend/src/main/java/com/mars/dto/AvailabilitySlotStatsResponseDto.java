package com.mars.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilitySlotStatsResponseDto {

    private long totalSlotCount;
    private long availableSlotCount;
    private long blockedSlotCount;
    private long thisWeekSlotCount;
}
