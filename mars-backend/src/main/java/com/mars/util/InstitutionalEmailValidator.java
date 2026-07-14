package com.mars.util;

import java.util.regex.Pattern;

public final class InstitutionalEmailValidator {

    public static final String INSTITUTIONAL_EMAIL_REGEX =
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.edu\\.tr$";

    private static final Pattern INSTITUTIONAL_EMAIL_PATTERN = Pattern.compile(
            INSTITUTIONAL_EMAIL_REGEX,
            Pattern.CASE_INSENSITIVE);

    private InstitutionalEmailValidator() {
    }

    public static boolean isValid(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return INSTITUTIONAL_EMAIL_PATTERN.matcher(email.trim()).matches();
    }
}
