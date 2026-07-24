ALTER TABLE user_email_notification_preference
ADD COLUMN system_announcements BOOLEAN NOT NULL DEFAULT TRUE;
