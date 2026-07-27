package com.mars.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.mars.config.MarsMailProperties;
import com.mars.dto.mail.HtmlMailRequest;
import com.mars.dto.mail.PlainTextMailRequest;
import com.mars.dto.mail.TemplateMailRequest;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MailService {
    private static final Logger LOGGER = LoggerFactory.getLogger(MailService.class);
    private static final String MAIL_TEMPLATE = "mail/mars-mail";

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final MarsMailProperties mailProperties;

    public boolean sendPlainText(PlainTextMailRequest request) {
        if (isDisabled()) {
            return true;
        }
        if (request == null || !isValid(request.recipient(), request.subject(), request.content())) {
            return false;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailProperties.from());
            message.setTo(request.recipient());
            message.setSubject(request.subject());
            message.setText(request.content());
            mailSender.send(message);
            return true;
        } catch (RuntimeException ex) {
            logFailure(ex);
            return false;
        }
    }

    public boolean sendHtml(HtmlMailRequest request) {
        if (isDisabled()) {
            return true;
        }
        if (request == null || !isValid(request.recipient(), request.subject(), request.htmlContent())) {
            return false;
        }
        return sendHtmlInternal(request.recipient(), request.subject(), request.htmlContent());
    }

    public boolean sendTemplate(TemplateMailRequest request) {
        if (isDisabled()) {
            return true;
        }
        if (request == null || !isValid(request.recipient(), request.subject(), request.content())
                || request.title() == null || request.title().isBlank()) {
            return false;
        }
        try {
            Context context = new Context(Locale.forLanguageTag("tr-TR"));
            context.setVariables(request.parameters() == null ? Map.of() : request.parameters());
            context.setVariable("title", request.title());
            context.setVariable("content", request.content());
            context.setVariable("actionText", request.actionText());
            context.setVariable("actionUrl", request.actionUrl());
            context.setVariable("showAction", hasText(request.actionText()) && hasText(request.actionUrl()));
            String template = hasText(request.templateName()) ? request.templateName() : MAIL_TEMPLATE;
            String html = templateEngine.process(template, context);
            return sendHtmlInternal(request.recipient(), request.subject(), html);
        } catch (RuntimeException ex) {
            logFailure(ex);
            return false;
        }
    }

    private boolean sendHtmlInternal(String recipient, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mailProperties.from());
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            return true;
        } catch (MessagingException | RuntimeException ex) {
            logFailure(ex);
            return false;
        }
    }

    private boolean isValid(String recipient, String subject, String content) {
        if (hasText(mailProperties.from()) && hasText(recipient)
                && hasText(subject) && hasText(content)) {
            return true;
        }
        LOGGER.warn("Mail günderilmedi: günderen adresi veya zorunlu mail alanları eksik.");
        return false;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean isDisabled() {
        if (mailProperties.enabled()) {
            return false;
        }
        LOGGER.debug("Mail günderimi devre dışı bırakıldığı için e-posta günderilmedi.");
        return true;
    }

    private void logFailure(Exception exception) {
        LOGGER.error("Mail günderilemedi. errorType={}", exception.getClass().getSimpleName());
    }
}
