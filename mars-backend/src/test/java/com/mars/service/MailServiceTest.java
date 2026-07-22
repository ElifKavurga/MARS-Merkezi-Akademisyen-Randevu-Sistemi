package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Properties;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.context.IContext;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

import com.mars.config.MarsMailProperties;
import com.mars.dto.mail.HtmlMailRequest;
import com.mars.dto.mail.PlainTextMailRequest;
import com.mars.dto.mail.TemplateMailRequest;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

@ExtendWith(MockitoExtension.class)
class MailServiceTest {

    @Mock private JavaMailSender mailSender;
    @Mock private TemplateEngine templateEngine;
    private MailService mailService;

    @BeforeEach
    void setUp() {
        mailService = new MailService(
                mailSender, templateEngine, new MarsMailProperties("no-reply@mars.edu.tr"));
    }

    @Test
    void sendPlainText_validRequest_sendsMessage() {
        boolean sent = mailService.sendPlainText(new PlainTextMailRequest(
                "student@mars.edu.tr", "Konu", "İçerik"));

        assertThat(sent).isTrue();
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getFrom()).isEqualTo("no-reply@mars.edu.tr");
        assertThat(captor.getValue().getTo()).containsExactly("student@mars.edu.tr");
        assertThat(captor.getValue().getSubject()).isEqualTo("Konu");
        assertThat(captor.getValue().getText()).isEqualTo("İçerik");
    }

    @Test
    void sendHtml_validRequest_sendsHtmlMimeMessage() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        boolean sent = mailService.sendHtml(new HtmlMailRequest(
                "student@mars.edu.tr", "HTML Konu", "<strong>İçerik</strong>"));

        assertThat(sent).isTrue();
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendTemplate_parametersAndAction_rendersSharedTemplate() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(any(String.class), any(IContext.class)))
                .thenReturn("<html>MARS</html>");
        TemplateMailRequest request = TemplateMailRequest.builder()
                .recipient("student@mars.edu.tr")
                .subject("Randevu")
                .title("Randevu Onaylandı")
                .content("Randevunuz onaylandı.")
                .actionText("Randevuyu Gör")
                .actionUrl("https://mars.edu.tr/randevular/1")
                .parameters(Map.of("appointmentId", 1))
                .build();

        assertThat(mailService.sendTemplate(request)).isTrue();

        ArgumentCaptor<IContext> contextCaptor = ArgumentCaptor.forClass(IContext.class);
        verify(templateEngine).process(org.mockito.ArgumentMatchers.eq("mail/mars-mail"), contextCaptor.capture());
        assertThat(contextCaptor.getValue().getVariable("appointmentId")).isEqualTo(1);
        assertThat(contextCaptor.getValue().getVariable("title")).isEqualTo("Randevu Onaylandı");
        assertThat(contextCaptor.getValue().getVariable("showAction")).isEqualTo(true);
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendTemplate_customTemplate_usesPublisherTemplate() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(any(String.class), any(IContext.class))).thenReturn("<html>MARS</html>");

        boolean sent = mailService.sendTemplate(TemplateMailRequest.builder()
                .recipient("student@mars.edu.tr")
                .subject("Bekleme Listesi")
                .title("Sıranız Geldi")
                .content("Rezervasyon hakkınız hazır.")
                .templateName("mail/waitlist-notification")
                .build());

        assertThat(sent).isTrue();
        verify(templateEngine).process(
                org.mockito.ArgumentMatchers.eq("mail/waitlist-notification"), any(IContext.class));
    }

    @Test
    void sendPlainText_transportFailure_returnsFalseWithoutThrowing() {
        doThrow(new MailSendException("SMTP unavailable"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        boolean sent = mailService.sendPlainText(new PlainTextMailRequest(
                "student@mars.edu.tr", "Konu", "İçerik"));

        assertThat(sent).isFalse();
    }

    @Test
    void sendTemplate_missingFromAddress_returnsFalse() {
        MailService unconfiguredService = new MailService(
                mailSender, templateEngine, new MarsMailProperties(""));

        boolean sent = unconfiguredService.sendTemplate(TemplateMailRequest.builder()
                .recipient("student@mars.edu.tr")
                .subject("Konu")
                .title("Başlık")
                .content("İçerik")
                .build());

        assertThat(sent).isFalse();
    }

    @Test
    void sharedTemplate_rendersResponsiveMarsLayoutAndDynamicFields() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        Context context = new Context();
        context.setVariable("title", "Randevu Onaylandı");
        context.setVariable("content", "Randevunuz başarıyla onaylandı.");
        context.setVariable("showAction", true);
        context.setVariable("actionText", "Randevuyu Gör");
        context.setVariable("actionUrl", "https://mars.edu.tr/randevular/1");

        String html = engine.process("mail/mars-mail", context);

        assertThat(html)
                .contains("Modern Akademisyen Randevu Sistemi")
                .contains("Randevu Onaylandı")
                .contains("Randevunuz başarıyla onaylandı.")
                .contains("Randevuyu Gör")
                .contains("width=device-width")
                .contains("otomatik olarak oluşturulmuştur");
    }

    @Test
    void processTemplates_reuseSharedMarsLayout() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        Context context = new Context();
        context.setVariable("title", "Süreç Bildirimi");
        context.setVariable("content", "Bilgilendirme içeriği");
        context.setVariable("showAction", false);
        context.setVariable("showSubtitle", false);
        context.setVariable("showStatus", false);
        context.setVariable("details", java.util.List.of());

        for (String template : java.util.List.of(
                "mail/waitlist-notification", "mail/no-show-notification", "mail/penalty-notification")) {
            assertThat(engine.process(template, context))
                    .contains("Modern Akademisyen Randevu Sistemi")
                    .contains("Süreç Bildirimi")
                    .contains("Bilgilendirme içeriği");
        }
    }
}
