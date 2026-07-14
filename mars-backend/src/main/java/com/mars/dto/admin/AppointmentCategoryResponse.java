package com.mars.dto.admin;

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
public class AppointmentCategoryResponse {

    private Integer categoryId;
    private String categoryName;
    private Integer durationMinutes;
    private String categoryGroup;
    private Boolean requiresCourseSelection;
}
