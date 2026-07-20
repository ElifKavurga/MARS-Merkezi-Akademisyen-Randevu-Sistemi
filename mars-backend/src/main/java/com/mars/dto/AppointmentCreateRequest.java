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
public class AppointmentCreateRequest {

    @NotNull(message = "Ofis saati seçimi zorunludur.")
    @Positive(message = "Geçerli bir ofis saati seçilmelidir.")
    private Integer slotId;

    @NotNull(message = "Randevu kategorisi zorunludur.")
    @Positive(message = "Geçerli bir randevu kategorisi seçilmelidir.")
    private Integer categoryId;

    @Positive(message = "Geçerli bir ders seçilmelidir.")
    private Integer courseId;

    /** BOTH slotlarında zorunlu; FACE_TO_FACE / ONLINE slotlarında sunucu atar. */
    private String meetingType;

    private Boolean isLimitedDuration;
}
