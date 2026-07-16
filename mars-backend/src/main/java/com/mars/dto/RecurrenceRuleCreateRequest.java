package com.mars.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecurrenceRuleCreateRequest {

    @NotBlank(message = "Tekrar türü zorunludur.")
    private String repeatType;

    @NotNull(message = "Tekrar sayısı zorunludur.")
    @Min(value = 1, message = "Tekrar sayısı pozitif olmalıdır.")
    private Integer repeatCount;

    @NotNull(message = "Tekrar başlangıç tarihi boş olamaz.")
    private LocalDate startDate;

    @NotNull(message = "Tekrar bitiş tarihi boş olamaz.")
    private LocalDate endDate;
}
