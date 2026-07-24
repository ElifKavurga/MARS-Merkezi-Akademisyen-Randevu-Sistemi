package com.mars.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodDepartmentStatsDto {

    /** Randevu durum dağılımı */
    private List<StatusCount> statusDistribution;

    /** Randevu kategori dağılımı */
    private List<CategoryCount> categoryDistribution;

    /** Son 7 günlük randevu yoğunluğu */
    private List<DayCount> weeklyTrend;

    /** Son 12 aylık randevu dağılımı */
    private List<MonthCount> monthlyTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCount {
        private String status;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryCount {
        private String categoryName;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayCount {
        /** ISO date string: yyyy-MM-dd */
        private String date;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthCount {
        /** yyyy-MM */
        private String yearMonth;
        private long count;
    }
}
