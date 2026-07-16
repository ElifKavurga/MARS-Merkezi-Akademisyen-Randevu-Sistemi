package com.mars.dto;

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
public class CourseUpdateRequest {

    @NotBlank(message = "Ders kodu zorunludur.")
    @Size(max = 50, message = "Ders kodu en fazla 50 karakter olabilir.")
    private String courseCode;

    @NotBlank(message = "Ders adı zorunludur.")
    @Size(max = 200, message = "Ders adı en fazla 200 karakter olabilir.")
    private String courseName;

    @NotBlank(message = "Akademik dönem zorunludur.")
    @Size(max = 50, message = "Akademik dönem en fazla 50 karakter olabilir.")
    private String academicTerm;

    @NotNull(message = "Bölüm seçimi zorunludur.")
    @Positive(message = "Bölüm seçimi zorunludur.")
    private Integer departmentId;
}
