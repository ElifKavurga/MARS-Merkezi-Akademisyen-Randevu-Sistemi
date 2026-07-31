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
public class StudentAcademicianDetailResponseDto {

    private Integer userId;
    private String fullName;
    private String academicTitle;
    private String departmentName;
    private String institutionalEmail;
    private Boolean isAcceptingAppointments;
    /** Modelde henüz yok; ileride doldurulabilir. */
    private String officeName;
    /** Modelde henüz yok; ileride doldurulabilir. */
    private String officeLocation;
    /** Serbest metin bu sprintte yok; istemci placeholder gösterir. */
    private String about;
    private List<StudentAcademicianCourseDto> courses;
}
