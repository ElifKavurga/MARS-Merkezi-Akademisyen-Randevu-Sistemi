package com.mars.dto;

import java.time.LocalDateTime;

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
public class AppointmentResponseDto {

    private Integer appointmentId;
    private Integer studentId;
    private Integer staffId;
    private Integer categoryId;
    private Integer courseId;
    private Integer slotId;
    private String appointmentStatus;
    private String meetingType;
    private Boolean isLimitedDuration;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
