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
public class CreateDelegationRequest {

    @NotNull(message = "Randevu seçimi zorunludur.")
    @Positive(message = "Randevu seçimi zorunludur.")
    private Integer appointmentId;

    @NotNull(message = "Asistan seçimi zorunludur.")
    @Positive(message = "Asistan seçimi zorunludur.")
    private Integer assistantId;
}
