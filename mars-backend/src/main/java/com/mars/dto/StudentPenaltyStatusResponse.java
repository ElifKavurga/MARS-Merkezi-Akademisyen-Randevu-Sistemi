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
public class StudentPenaltyStatusResponse {

    private Boolean penaltyActive;
    private Integer totalNoShowCount;
    private Integer maxNoShowCount;
    private Integer remainingDays;
    private LocalDate restrictionEndDate;
    private Integer penaltyDurationDays;
}
