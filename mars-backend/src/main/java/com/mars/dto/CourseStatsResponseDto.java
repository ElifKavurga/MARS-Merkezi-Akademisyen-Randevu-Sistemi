package com.mars.dto;

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
public class CourseStatsResponseDto {

    private Integer totalAssistantCount;
    private Boolean isActive;
    private String academicTerm;
    private String departmentName;
}
