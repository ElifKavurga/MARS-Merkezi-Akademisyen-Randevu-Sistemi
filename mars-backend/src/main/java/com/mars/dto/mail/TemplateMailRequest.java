package com.mars.dto.mail;

import java.util.Map;

import lombok.Builder;

@Builder
public record TemplateMailRequest(
        String recipient,
        String subject,
        String title,
        String content,
        String actionText,
        String actionUrl,
        Map<String, Object> parameters,
        String templateName) {
}
