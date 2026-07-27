package com.mars.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.mars.dto.auth.LoginRequest;
import com.mars.dto.auth.LoginResponse;
import com.mars.dto.auth.ResetPasswordRequest;
import com.mars.dto.auth.ResetPasswordResponse;
import com.mars.entity.User;
import com.mars.exception.BadRequestException;
import com.mars.security.CustomUserDetails;
import com.mars.security.JwtService;
import com.mars.security.SecurityMessages;
import com.mars.util.InstitutionalEmailValidator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private static final String RESET_PASSWORD_SUCCESS_MESSAGE =
            "��ifre sıfırlama bağlantısı kurumsal e-posta adresinize gönderildi.";

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getInstitutionalEmail(),
                        request.getPassword()));

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        if (!userDetails.isEnabled()) {
            throw new DisabledException(SecurityMessages.ACCOUNT_INACTIVE);
        }

        User user = userDetails.getUser();
        String token = jwtService.generateToken(user.getInstitutionalEmail());

        return LoginResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .institutionalEmail(user.getInstitutionalEmail())
                .role(user.getRole().getRoleName())
                .department(user.getDepartment().getDepartmentName())
                .isActive(user.getIsActive())
                .build();
    }

    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        String email = request.getInstitutionalEmail() == null
                ? null
                : request.getInstitutionalEmail().trim();

        if (!InstitutionalEmailValidator.isValid(email)) {
            throw new BadRequestException("Geçerli bir kurumsal (@...edu.tr) e-posta adresi giriniz.");
        }

        // Dummy akış: gerçek e-posta gönderilmez. Kullanıcı var/yok ayırt edilmez.
        return ResetPasswordResponse.builder()
                .message(RESET_PASSWORD_SUCCESS_MESSAGE)
                .build();
    }
}
