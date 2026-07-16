package com.mars.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseAssistantCreateRequest {

    @NotNull(message = "Asistan seçimi zorunludur.")
    @Positive(message = "Asistan seçimi zorunludur.")
    private Integer assistantId;
}
