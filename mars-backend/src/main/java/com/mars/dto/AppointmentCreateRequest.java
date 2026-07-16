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
public class AppointmentCreateRequest {

    @NotNull(message = "Ofis saati seçimi zorunludur.")
    private Integer slotId;

    @NotNull(message = "Randevu kategorisi zorunludur.")
    private Integer categoryId;

    private Integer courseId;

    /** BOTH slotlarında zorunlu; FACE_TO_FACE / ONLINE slotlarında sunucu atar. */
    private String meetingType;

    private Boolean isLimitedDuration;
}
