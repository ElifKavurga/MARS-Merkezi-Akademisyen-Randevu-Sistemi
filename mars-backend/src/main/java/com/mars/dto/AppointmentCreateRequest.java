package com.mars.dto;

import java.time.LocalDate;
import java.time.LocalTime;

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

    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;

    public AppointmentCreateRequest(Integer slotId, Integer categoryId, Integer courseId, String meetingType, Boolean isLimitedDuration) {
        this.slotId = slotId;
        this.categoryId = categoryId;
        this.courseId = courseId;
        this.meetingType = meetingType;
        this.isLimitedDuration = isLimitedDuration;
    }
}
