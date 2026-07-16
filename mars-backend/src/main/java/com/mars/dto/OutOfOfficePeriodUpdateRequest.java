package com.mars.dto;

import java.time.LocalDate;

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
public class OutOfOfficePeriodUpdateRequest {

    @NotNull(message = "Başlangıç tarihi zorunludur.")
    private LocalDate startDate;

    @NotNull(message = "Bitiş tarihi zorunludur.")
    private LocalDate endDate;

    @NotBlank(message = "Sebep zorunludur.")
    private String reasonCode;
}
