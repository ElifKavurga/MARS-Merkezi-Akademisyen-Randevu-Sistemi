package com.mars.dto.mail;

public record PlainTextMailRequest(String recipient, String subject, String content) {
}
