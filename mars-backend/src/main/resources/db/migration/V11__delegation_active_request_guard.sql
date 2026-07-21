CREATE UNIQUE INDEX uq_delegation_active_request_per_appointment
    ON delegation_log (appointment_id)
    WHERE delegation_status IN ('PENDING', 'PENDING_STUDENT_APPROVAL');
