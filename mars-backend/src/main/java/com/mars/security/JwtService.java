package com.mars.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final String PASSWORD_FINGERPRINT_CLAIM = "pwd";
    private static final String TOKEN_TYPE_CLAIM = "typ";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String PASSWORD_RESET_TOKEN_TYPE = "password-reset";

    private final SecretKey secretKey;
    private final long expirationMs;
    private final long passwordResetExpirationMs;

    public JwtService(
            @Value("${mars.jwt.secret}") String secret,
            @Value("${mars.jwt.expiration-ms}") long expirationMs,
            @Value("${mars.jwt.password-reset-expiration-ms:900000}") long passwordResetExpirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.passwordResetExpirationMs = passwordResetExpirationMs;
    }

    public String generateToken(String institutionalEmail, String passwordHash) {
        return buildToken(institutionalEmail, passwordHash, ACCESS_TOKEN_TYPE, expirationMs);
    }

    public String generatePasswordResetToken(String institutionalEmail, String passwordHash) {
        return buildToken(institutionalEmail, passwordHash, PASSWORD_RESET_TOKEN_TYPE, passwordResetExpirationMs);
    }

    private String buildToken(
            String institutionalEmail,
            String passwordHash,
            String tokenType,
            long tokenExpirationMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + tokenExpirationMs);

        return Jwts.builder()
                .subject(institutionalEmail)
                .claim(TOKEN_TYPE_CLAIM, tokenType)
                .claim(PASSWORD_FINGERPRINT_CLAIM, passwordFingerprint(passwordHash))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception ex) {
            return false;
        }
    }

    public boolean isTokenValid(String token, String institutionalEmail) {
        return isTokenValid(token, institutionalEmail, null);
    }

    public boolean isTokenValid(String token, String institutionalEmail, String passwordHash) {
        try {
            Claims claims = extractAllClaims(token);
            String username = extractUsername(token);
            if (!username.equals(institutionalEmail) || !claims.getExpiration().after(new Date())) {
                return false;
            }
            if (passwordHash == null) {
                return true;
            }
            return ACCESS_TOKEN_TYPE.equals(claims.get(TOKEN_TYPE_CLAIM, String.class))
                    && passwordFingerprint(passwordHash).equals(
                            claims.get(PASSWORD_FINGERPRINT_CLAIM, String.class));
        } catch (Exception ex) {
            return false;
        }
    }

    public boolean isPasswordResetTokenValid(String token, String institutionalEmail, String passwordHash) {
        try {
            Claims claims = extractAllClaims(token);
            return institutionalEmail.equals(claims.getSubject())
                    && claims.getExpiration().after(new Date())
                    && PASSWORD_RESET_TOKEN_TYPE.equals(claims.get(TOKEN_TYPE_CLAIM, String.class))
                    && passwordFingerprint(passwordHash).equals(
                            claims.get(PASSWORD_FINGERPRINT_CLAIM, String.class));
        } catch (Exception ex) {
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String passwordFingerprint(String passwordHash) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(passwordHash.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm is not available.", ex);
        }
    }
}
