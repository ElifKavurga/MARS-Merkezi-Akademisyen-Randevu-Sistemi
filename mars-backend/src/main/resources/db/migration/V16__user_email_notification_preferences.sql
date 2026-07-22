CREATE TABLE user_email_notification_preference (
    user_id                    INTEGER PRIMARY KEY,
    appointment_request       BOOLEAN NOT NULL DEFAULT TRUE,
    appointment_approval      BOOLEAN NOT NULL DEFAULT TRUE,
    appointment_rejection     BOOLEAN NOT NULL DEFAULT TRUE,
    appointment_cancellation  BOOLEAN NOT NULL DEFAULT TRUE,
    reschedule                BOOLEAN NOT NULL DEFAULT TRUE,
    delegation                BOOLEAN NOT NULL DEFAULT TRUE,
    appointment_reminder      BOOLEAN NOT NULL DEFAULT TRUE,
    waitlist                  BOOLEAN NOT NULL DEFAULT TRUE,
    no_show                   BOOLEAN NOT NULL DEFAULT TRUE,
    penalty                   BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_email_preference_user FOREIGN KEY (user_id) REFERENCES "user" (user_id)
);
