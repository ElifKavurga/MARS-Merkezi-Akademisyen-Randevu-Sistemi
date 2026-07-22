ALTER TABLE notification
    ADD COLUMN event_key VARCHAR(64);

CREATE UNIQUE INDEX uq_notification_user_event
    ON notification (user_id, event_key);

CREATE INDEX idx_notification_user_created_at
    ON notification (user_id, created_at DESC);

CREATE INDEX idx_notification_user_unread
    ON notification (user_id, is_read);

CREATE INDEX idx_notification_created_at
    ON notification (created_at);
