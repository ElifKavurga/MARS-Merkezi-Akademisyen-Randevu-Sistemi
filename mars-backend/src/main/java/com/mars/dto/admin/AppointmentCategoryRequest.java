package com.mars.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentCategoryRequest {

    private String categoryName;
    private Integer durationMinutes;
    private String categoryGroup;
    private Boolean requiresCourseSelection;
}
