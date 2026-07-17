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
public class AssistantCourseResponseDto {

    private Integer courseId;
    private String courseCode;
    private String courseName;
    private String academicTerm;
    private String ownerAcademicianName;
}
