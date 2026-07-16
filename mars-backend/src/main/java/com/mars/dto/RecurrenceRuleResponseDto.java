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
public class RecurrenceRuleResponseDto {

    private Integer recurrenceRuleId;
    private String repeatType;
    private Integer repeatCount;
    private LocalDate startDate;
    private LocalDate endDate;
}
