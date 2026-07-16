package com.mars.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilitySlotBlockRequest {

    @NotNull(message = "Engelleme durumu zorunludur.")
    private Boolean isBlocked;
}
