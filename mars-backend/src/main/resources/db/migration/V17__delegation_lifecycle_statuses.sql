DROP INDEX IF EXISTS uq_delegation_active_request_per_appointment;

CREATE UNIQUE INDEX uq_delegation_active_request_per_appointment
    ON delegation_log (appointment_id)
    WHERE delegation_status IN (
        'PENDING',
        'PENDING_ACADEMICIAN_APPROVAL',
        'PENDING_STUDENT_APPROVAL'
    );

CREATE INDEX IF NOT EXISTS idx_delegation_status_updated
    ON delegation_log (delegation_status, updated_at);
