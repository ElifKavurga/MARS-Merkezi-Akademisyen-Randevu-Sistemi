package com.mars.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodDepartmentAnalysisDto {
    private NoShowAnalysis noShowAnalysis;
    private WaitlistAnalysis waitlistAnalysis;
    private GeneralAnalysis generalAnalysis;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NoShowAnalysis {
        private long totalNoShow;
        private double noShowRate;
        private String mostNoShowDay;
        private String mostNoShowTimeRange;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WaitlistAnalysis {
        private long totalWaitlistStudents;
        private List<String> topWaitlistCategories;
        private long convertedToAppointmentCount;
        private String averageWaitTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeneralAnalysis {
        private String busiestAcademician;
        private double avgDailyAppointments;
        private double avgWeeklyAppointments;
        private String busiestCategory;
        private String busiestDay;
        private String busiestTimeRange;
    }
}
