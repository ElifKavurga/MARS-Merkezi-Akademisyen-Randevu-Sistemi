ALTER TABLE notification
    ADD COLUMN related_appointment_id INTEGER;

ALTER TABLE notification
    ADD CONSTRAINT fk_notification_appointment
        FOREIGN KEY (related_appointment_id) REFERENCES appointment (appointment_id);

CREATE INDEX idx_notification_related_appointment
    ON notification (related_appointment_id);

UPDATE notification
SET notification_type = 'STUDENT_APPROVAL_PENDING'
WHERE notification_type = 'DELEGATION_STUDENT_APPROVAL';

UPDATE notification
SET notification_type = 'DELEGATION_ACCEPTED'
WHERE notification_type = 'DELEGATION_STUDENT_ACCEPTED';

UPDATE notification
SET notification_type = 'DELEGATION_REJECTED'
WHERE notification_type = 'DELEGATION_STUDENT_REJECTED';
