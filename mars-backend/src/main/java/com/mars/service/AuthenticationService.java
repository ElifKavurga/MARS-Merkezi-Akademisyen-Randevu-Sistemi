package com.mars.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.auth.LoginRequest;
import com.mars.dto.auth.LoginResponse;
import com.mars.dto.auth.ResetPasswordConfirmRequest;
import com.mars.dto.auth.ResetPasswordRequest;
import com.mars.dto.auth.ResetPasswordResponse;
import com.mars.dto.mail.TemplateMailRequest;
import com.mars.entity.User;
import com.mars.exception.BadRequestException;
import com.mars.repository.UserRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.JwtService;
import com.mars.security.SecurityMessages;
import com.mars.util.InstitutionalEmailValidator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private static final String RESET_PASSWORD_SUCCESS_MESSAGE =
            "Şifre sıfırlama bağlantısı kurumsal e-posta adresinize gönderildi.";
    private static final String RESET_PASSWORD_COMPLETED_MESSAGE =
            "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.";
    private static final String RESET_PASSWORD_INVALID_MESSAGE =
            "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.";

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    @Value("${mars.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

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
        String token = jwtService.generateToken(user.getInstitutionalEmail(), user.getPasswordHash());

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

    @Transactional(readOnly = true)
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        String email = request.getInstitutionalEmail() == null
                ? null
                : request.getInstitutionalEmail().trim().toLowerCase();

        if (!InstitutionalEmailValidator.isValid(email)) {
            throw new BadRequestException("Geçerli bir kurumsal (@...edu.tr) e-posta adresi giriniz.");
        }

        userRepository.findByInstitutionalEmail(email)
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .ifPresent(this::sendPasswordResetMail);

        return ResetPasswordResponse.builder()
                .message(RESET_PASSWORD_SUCCESS_MESSAGE)
                .build();
    }

    @Transactional
    public ResetPasswordResponse confirmResetPassword(ResetPasswordConfirmRequest request) {
        String token = request.getToken() == null ? "" : request.getToken().trim();
        String email;
        try {
            email = jwtService.extractUsername(token);
        } catch (Exception ex) {
            throw new BadRequestException(RESET_PASSWORD_INVALID_MESSAGE);
        }

        User user = userRepository.findByInstitutionalEmail(email)
                .orElseThrow(() -> new BadRequestException(RESET_PASSWORD_INVALID_MESSAGE));

        if (!Boolean.TRUE.equals(user.getIsActive())
                || !jwtService.isPasswordResetTokenValid(token, user.getInstitutionalEmail(), user.getPasswordHash())) {
            throw new BadRequestException(RESET_PASSWORD_INVALID_MESSAGE);
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new BadRequestException("Yeni şifre ve tekrarı eşleşmiyor.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResetPasswordResponse.builder()
                .message(RESET_PASSWORD_COMPLETED_MESSAGE)
                .build();
    }

    private void sendPasswordResetMail(User user) {
        String token = jwtService.generatePasswordResetToken(
                user.getInstitutionalEmail(), user.getPasswordHash());
        String resetUrl = frontendBaseUrl.replaceAll("/+$", "")
                + "/sifre-sifirlama?token=" + token;

        boolean sent = mailService.sendTemplate(TemplateMailRequest.builder()
                .recipient(user.getInstitutionalEmail())
                .subject("MARS Şifre Sıfırlama")
                .title("Şifre Sıfırlama")
                .content("MARS hesabınız için şifre sıfırlama talebi alındı. Bu bağlantı 15 dakika geçerlidir.")
                .actionText("Şifremi Sıfırla")
                .actionUrl(resetUrl)
                .parameters(Map.of("resetUrl", resetUrl))
                .build());
        if (!sent) {
            throw new BadRequestException(
                    "Şifre sıfırlama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.");
        }
    }
}
