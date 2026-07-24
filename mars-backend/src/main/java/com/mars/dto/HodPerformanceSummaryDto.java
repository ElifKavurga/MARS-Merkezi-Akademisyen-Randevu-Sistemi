package com.mars.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodPerformanceSummaryDto {
    private Long totalCompleted;
    private Double averageDaily;
    private Long noShowCount;
    private Double noShowRate;
    private String averageResponseTime;
    private String busiestDay;
    private String busiestTimeRange;
}
