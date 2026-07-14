package com.mars.dto.admin;

import com.mars.util.InstitutionalEmailValidator;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class UpdateUserRequest {

    @NotBlank(message = "Ad soyad zorunludur.")
    @Size(max = 150, message = "Ad soyad en fazla 150 karakter olabilir.")
    private String fullName;

    @NotBlank(message = "Kurumsal e-posta zorunludur.")
    @Pattern(
            regexp = InstitutionalEmailValidator.INSTITUTIONAL_EMAIL_REGEX,
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Geçerli bir kurumsal (@...edu.tr) e-posta adresi giriniz.")
    private String institutionalEmail;

    @NotNull(message = "Rol seçimi zorunludur.")
    @Positive(message = "Rol seçimi zorunludur.")
    private Integer roleId;

    @NotNull(message = "Bölüm seçimi zorunludur.")
    @Positive(message = "Bölüm seçimi zorunludur.")
    private Integer departmentId;
}
