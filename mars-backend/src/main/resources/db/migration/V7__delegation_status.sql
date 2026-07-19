ALTER TABLE delegation_log
    ADD COLUMN delegation_status VARCHAR(255) NOT NULL DEFAULT 'PENDING';
