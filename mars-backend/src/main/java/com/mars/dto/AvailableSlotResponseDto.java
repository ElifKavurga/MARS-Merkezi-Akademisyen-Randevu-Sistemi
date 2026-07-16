package com.mars.dto;

import java.time.LocalDate;
import java.time.LocalTime;

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
public class AvailableSlotResponseDto {

    private Integer slotId;
    private Integer staffId;
    private String staffName;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String meetingType;
}
