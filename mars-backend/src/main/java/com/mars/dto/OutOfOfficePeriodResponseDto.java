package com.mars.dto;

import java.time.LocalDate;

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
public class OutOfOfficePeriodResponseDto {

    private Integer outOfOfficeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reasonCode;
}
