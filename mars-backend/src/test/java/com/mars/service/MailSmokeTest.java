package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.context.ActiveProfiles;

import com.mars.dto.mail.TemplateMailRequest;

@SpringBootTest
@ActiveProfiles("test")
@EnabledIfSystemProperty(named = "mars.mail.smoke-test", matches = "true")
class MailSmokeTest {
    @Autowired private MailService mailService;
    @Value("${mars.mail.test-recipient:}") private String testRecipient;

    @Test
    void smtpConfiguration_sendsMarsTestMail() {
        boolean sent = mailService.sendTemplate(TemplateMailRequest.builder()
                .recipient(testRecipient)
                .subject("MARS Mail Sistemi Test")
                .title("MARS Mail Sistemi Test")
                .content("MARS Akademik Randevu Sistemi mail altyapısı başarıyla yapılandırılmıştır.")
                .build());

        assertThat(sent).isTrue();
    }
}
