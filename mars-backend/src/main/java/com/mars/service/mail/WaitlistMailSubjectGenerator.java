package com.mars.service.mail;

import org.springframework.stereotype.Component;

import com.mars.enums.WaitlistNotificationEvent;

@Component
public class WaitlistMailSubjectGenerator {
    public String subject(WaitlistNotificationEvent event) {
        return switch (event) {
            case ADDED -> "MARS Bekleme Listesi Kaydınız Oluşturuldu";
            case TURN_AVAILABLE -> "MARS Bekleme Listesinde Sıranız Geldi";
            case REMOVED -> "MARS Bekleme Listesinden Çıkarıldınız";
            case CANCELLED -> "MARS Bekleme Listesi Kaydınız İptal Edildi";
        };
    }
}
