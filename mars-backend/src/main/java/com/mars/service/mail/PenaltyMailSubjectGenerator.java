package com.mars.service.mail;

import org.springframework.stereotype.Component;

import com.mars.enums.PenaltyNotificationEvent;

@Component
public class PenaltyMailSubjectGenerator {
    public String subject(PenaltyNotificationEvent event) {
        return switch (event) {
            case APPLIED -> "MARS Randevu Kısıtlaması Bilgilendirmesi";
            case LIFTED -> "MARS Randevu Kısıtlamanız Sona Erdi";
        };
    }
}
