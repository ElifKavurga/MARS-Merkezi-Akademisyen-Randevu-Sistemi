CREATE TABLE delegation_status_history (
    history_id SERIAL PRIMARY KEY,
    delegation_id INT NOT NULL REFERENCES delegation_log(delegation_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_delegation_status_history_delegation_changed
    ON delegation_status_history (delegation_id, changed_at);

INSERT INTO delegation_status_history (delegation_id, status, changed_at)
SELECT delegation_id, delegation_status, COALESCE(updated_at, delegated_at)
FROM delegation_log;
