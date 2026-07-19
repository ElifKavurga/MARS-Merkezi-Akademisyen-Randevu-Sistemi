package com.mars.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
public class DelegationResponse {

    private Integer delegationId;
    private Integer appointmentId;
    private Integer delegatedByUserId;
    private String delegatedByUserName;
    private Integer delegatedToUserId;
    private LocalDateTime delegatedAt;
    private String delegationStatus;
    private String categoryName;
    private String courseCode;
    private String courseName;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String meetingType;
}
