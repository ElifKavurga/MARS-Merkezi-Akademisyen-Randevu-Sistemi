ALTER TABLE waitlist_entry ADD COLUMN slot_id INTEGER REFERENCES availability_slot(slot_id);
ALTER TABLE waitlist_entry ADD COLUMN offered_at TIMESTAMP(6);
