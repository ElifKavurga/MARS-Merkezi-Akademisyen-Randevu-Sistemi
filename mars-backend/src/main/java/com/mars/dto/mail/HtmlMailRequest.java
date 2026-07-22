package com.mars.dto.mail;

public record HtmlMailRequest(String recipient, String subject, String htmlContent) {
}
