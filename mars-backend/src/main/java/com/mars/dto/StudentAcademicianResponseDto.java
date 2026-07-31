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
public class StudentAcademicianResponseDto {

    private Integer userId;
    private String fullName;
    private String academicTitle;
    private String departmentName;
    private String institutionalEmail;
    private Boolean isAcceptingAppointments;
}
