package com.mars.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilitySlotCreateRequest {

    /** ONE_TIME | RECURRING */
    @NotBlank(message = "Ofis saati türü zorunludur.")
    private String slotType;

    /** Tek seferlik ofis saati tarihi. */
    private LocalDate slotDate;

    /** Tekrarlayan ofis saati günleri (Pazartesi=1 - Cuma=5). */
    @Size(max = 5, message = "En fazla beş gün seçilebilir.")
    private List<@NotNull @Min(value = 1, message = "Geçersiz gün.") @Max(value = 5, message = "Geçersiz gün.") Integer> daysOfWeek;

    @NotNull(message = "Başlangıç saati zorunludur.")
    private LocalTime startTime;

    @NotNull(message = "Bitiş saati zorunludur.")
    private LocalTime endTime;

    /** TERM_END | UNTIL_DATE - yalnızca RECURRING iken anlamlıdır. */
    private String recurrenceEndMode;

    /** UNTIL_DATE seçildiğinde zorunludur. */
    private LocalDate recurrenceEndDate;

    /** FACE_TO_FACE | ONLINE | BOTH - varsayılan FACE_TO_FACE. */
    private String meetingType;
}
