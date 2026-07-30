package com.mars.dto;

import java.time.LocalDate;

import com.mars.enums.AppointmentErrorCode;

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
public class StudentAppointmentRestrictionResponse {

    private AppointmentErrorCode errorCode;
    private Boolean penaltyActive;
    private Integer remainingDays;
    private LocalDate restrictionEndDate;
    private Integer penaltyDurationDays;
}
