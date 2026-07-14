package com.mars.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentCategoryRequest {

    @NotBlank(message = "Kategori adı zorunludur.")
    @Size(max = 100, message = "Kategori adı en fazla 100 karakter olabilir.")
    private String categoryName;

    @NotNull(message = "Süre zorunludur.")
    @Positive(message = "Süre 0'dan büyük olmalıdır.")
    private Integer durationMinutes;

    @NotBlank(message = "Kategori grubu zorunludur.")
    private String categoryGroup;

    @NotNull(message = "Ders seçimi zorunluluk bilgisi zorunludur.")
    private Boolean requiresCourseSelection;
}
