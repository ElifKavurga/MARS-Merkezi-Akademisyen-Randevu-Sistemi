package com.mars.dto.auth;

import com.mars.util.InstitutionalEmailValidator;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Kurumsal e-posta zorunludur.")
    @Pattern(
            regexp = InstitutionalEmailValidator.INSTITUTIONAL_EMAIL_REGEX,
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Geçerli bir kurumsal (@...edu.tr) e-posta adresi giriniz.")
    private String institutionalEmail;
}
