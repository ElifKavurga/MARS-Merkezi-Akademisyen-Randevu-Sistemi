package com.mars.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodRecentAppointmentDto {
    private Integer appointmentId;
    private String date;
    private String startTime;
    private String endTime;
    private String studentName;
    private String categoryName;
    private String status;
    private String meetingType;
    private Long durationMinutes;
}
