package com.mars.dto.user;

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
public class UpdateProfileRequestDto {

    @Size(max = 20, message = "Telefon numarası en fazla 20 karakter olabilir.")
    @Pattern(regexp = "^\\+?[0-9]*$", message = "Geçerli bir telefon numarası giriniz.")
    private String phone;
}
