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
public class AppointmentRescheduleRequest {

    @NotNull(message = "Ofis saati seçimi zorunludur.")
    @Positive(message = "Geçerli bir ofis saati seçilmelidir.")
    private Integer slotId;

    @NotNull(message = "Randevu tarihi zorunludur.")
    private LocalDate appointmentDate;

    @NotNull(message = "Başlangıç saati zorunludur.")
    private LocalTime startTime;

    @NotNull(message = "Bitiş saati zorunludur.")
    private LocalTime endTime;

    private String meetingType;
}
