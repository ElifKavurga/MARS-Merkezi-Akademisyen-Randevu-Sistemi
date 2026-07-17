package com.mars.dto;

import java.util.List;

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
public class AssistantDashboardResponseDto {

    private Integer assignedCourseCount;
    private Integer relatedAcademicianCount;
    private List<AssistantCourseResponseDto> assignedCoursesPreview;
}
