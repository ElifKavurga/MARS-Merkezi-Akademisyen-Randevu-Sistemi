package com.mars.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilitySlotCreateRequest {

    @NotNull(message = "Tarih zorunludur.")
    private LocalDate slotDate;

    @NotNull(message = "Başlangıç saati zorunludur.")
    private LocalTime startTime;

    @NotNull(message = "Bitiş saati zorunludur.")
    private LocalTime endTime;
}
