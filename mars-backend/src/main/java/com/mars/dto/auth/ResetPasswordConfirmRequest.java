package com.mars.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordConfirmRequest {

    @NotBlank(message = "Sıfırlama tokenı zorunludur.")
    private String token;

    @NotBlank(message = "Yeni şifre zorunludur.")
    @Size(min = 6, max = 100, message = "Yeni şifre 6-100 karakter arasında olmalıdır.")
    private String newPassword;

    @NotBlank(message = "Yeni şifre tekrarı zorunludur.")
    private String confirmNewPassword;
}
