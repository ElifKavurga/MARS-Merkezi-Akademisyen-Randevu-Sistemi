package com.mars.dto.auth;

import com.mars.util.InstitutionalEmailValidator;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Kurumsal e-posta zorunludur.")
    @Pattern(
            regexp = InstitutionalEmailValidator.INSTITUTIONAL_EMAIL_REGEX,
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Ge�erli bir kurumsal (@...edu.tr) e-posta adresi giriniz.")
    private String institutionalEmail;

    @NotBlank(message = "Şifre zorunludur.")
    @Size(min = 1, max = 100, message = "Şifre geçersiz.")
    private String password;
}
