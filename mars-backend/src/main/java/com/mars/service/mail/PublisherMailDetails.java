package com.mars.service.mail;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mars.dto.mail.MailDetail;

@Component
public class PublisherMailDetails {
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    public Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private final List<MailDetail> details = new ArrayList<>();

        public Builder add(String label, String value) {
            if (value != null && !value.isBlank()) {
                details.add(new MailDetail(label, value));
            }
            return this;
        }

        public Builder add(String label, LocalDate value) {
            return add(label, value == null ? null : value.format(DATE_FORMAT));
        }

        public Builder addTimeRange(String label, LocalTime start, LocalTime end) {
            if (start == null) {
                return this;
            }
            String value = start.format(TIME_FORMAT);
            if (end != null) {
                value += " - " + end.format(TIME_FORMAT);
            }
            return add(label, value);
        }

        public List<MailDetail> build() {
            return List.copyOf(details);
        }
    }
}
