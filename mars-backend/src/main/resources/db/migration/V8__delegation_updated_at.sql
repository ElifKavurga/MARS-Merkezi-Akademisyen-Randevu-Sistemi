ALTER TABLE delegation_log
    ADD COLUMN updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE delegation_log
SET updated_at = delegated_at;
