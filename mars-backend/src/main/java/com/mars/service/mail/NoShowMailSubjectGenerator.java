package com.mars.service.mail;

import org.springframework.stereotype.Component;

@Component
public class NoShowMailSubjectGenerator {
    public String studentSubject() {
        return "MARS Randevu Katılım Bilgilendirmesi";
    }

    public String staffSubject() {
        return "MARS No-Show Kaydı Oluşturuldu";
    }
}
