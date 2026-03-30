-- V6: Add expiry timestamp for email verification tokens.
-- Previously tokens never expired; this adds a 24-hour expiry window
-- to prevent indefinitely valid verification links.
ALTER TABLE users ADD COLUMN email_verification_token_expiry TIMESTAMP;
