package com.mars.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DelegationTargetResponse {
    private Integer userId;
    private String fullName;
    private String institutionalEmail;
    private String role;
    private String departmentName;
    private Boolean relatedCourseAssistant;
    private Boolean requiresStudentApproval;
    private Integer targetSlotId;
    private LocalDate targetSlotDate;
    private LocalTime targetStartTime;
    private LocalTime targetEndTime;
}
