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
public class StudentAppointmentCategoryResponseDto {

    private Integer categoryId;
    private String categoryName;
    /** Modelde açıklama alanı yok; ileride eklenebilir. */
    private String description;
    private Integer durationMinutes;
    private String categoryGroup;
    private Boolean requiresCourseSelection;
}
