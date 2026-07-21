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

    @Positive(message = "Asistan seçimi zorunludur.")
    private Integer assistantId;

    @Positive(message = "Hedef personel seçimi zorunludur.")
    private Integer targetUserId;

    @NotNull(message = "Hedef slot seçimi zorunludur.")
    @Positive(message = "Hedef slot seçimi zorunludur.")
    private Integer targetSlotId;

    @NotNull(message = "Hedef slot tarihi zorunludur.")
    private java.time.LocalDate targetSlotDate;

    @NotNull(message = "Hedef başlangıç saati zorunludur.")
    private java.time.LocalTime targetStartTime;

    @NotNull(message = "Hedef bitiş saati zorunludur.")
    private java.time.LocalTime targetEndTime;

    public Integer resolveTargetUserId() {
        return targetUserId != null ? targetUserId : assistantId;
    }

    public CreateDelegationRequest(Integer appointmentId, Integer assistantId) {
        this.appointmentId = appointmentId;
        this.assistantId = assistantId;
    }
}
