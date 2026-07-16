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
public class CourseAssistantResponseDto {

    private Integer assignmentId;
    private Integer assistantId;
    private String assistantName;
    private String institutionalEmail;
    private String departmentName;
}
